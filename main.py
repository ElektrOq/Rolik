import os
import json
import uuid
import shutil
import copy
import yaml
import re
from datetime import datetime

# ==========================================
# 1. УТИЛИТЫ И КОНСТАНТЫ
# ==========================================
MICROSEC = 1_000_000

def natural_sort_key(s):
    """Сортировка: 1.jpg, 2.jpg ... 10.jpg"""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def generate_id():
    """Генератор уникальных ID для объектов CapCut"""
    return str(uuid.uuid4()).upper()

# ==========================================
# 2. ФЕЙКОВЫЙ АНАЛИЗАТОР ЗВУКА
# ==========================================
def get_dummy_timings():
    """Эмулируем ответ от Whisper для файла veter.mp3 (10 слов на 10 картинок)"""
    return [
        {"word": "Раз", "start": 0.0, "end": 0.8},
        {"word": "два", "start": 0.8, "end": 1.5},
        {"word": "три", "start": 1.5, "end": 2.2},
        {"word": "четыре", "start": 2.2, "end": 2.9},
        {"word": "пять", "start": 2.9, "end": 3.7},
        {"word": "шесть", "start": 3.7, "end": 4.5},
        {"word": "семь", "start": 4.5, "end": 5.1},
        {"word": "восемь", "start": 5.1, "end": 5.8},
        {"word": "девять", "start": 5.8, "end": 6.5},
        {"word": "десять", "start": 6.5, "end": 7.5} # Видео будет длиться 7.5 секунд + паузы
    ]

# ==========================================
# 3. МАТЕМАТИКА ТАЙМЛАЙНА
# ==========================================
def build_timeline(config, timings, image_files):
    min_duration = config['video'].get('min_image_duration', 1.2)
    pad_start = config['video'].get('padding_start', 0.3)
    pad_end = config['video'].get('padding_end', 1.0)

    chunks = []
    current_start = max(0.0, timings[0]['start'] - pad_start)
    
    for i, timing in enumerate(timings):
        is_last_word = (i == len(timings) - 1)
        current_duration = timing['end'] - current_start
        
        # Если слово звучит дольше минимального времени или оно последнее
        if current_duration >= min_duration or is_last_word:
            current_end = timing['end']
            if is_last_word:
                current_end += pad_end
                
            chunks.append({
                'start_us': int(current_start * MICROSEC),
                'duration_us': int((current_end - current_start) * MICROSEC),
                'end_sec': current_end
            })
            if not is_last_word:
                current_start = current_end

    # Назначаем картинки
    final_timeline = []
    for i, chunk in enumerate(chunks):
        img_path = image_files[i % len(image_files)] # Берем картинки по кругу, если не хватает
        chunk['image_path'] = img_path
        final_timeline.append(chunk)

    total_duration_us = int(chunks[-1]['end_sec'] * MICROSEC)
    return final_timeline, total_duration_us

# ==========================================
# 4. ГЛАВНЫЙ КЛАСС СОБОРКИ
# ==========================================
class AutoVideoMaker:
    def __init__(self):
        with open("config.yaml", 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
            
        paths = self.config.get('paths', {})
        self.in_images = paths.get('input_images', 'input/images/')
        self.in_voice = paths.get('input_voice', 'input/voice/')
        self.template_dir = paths.get('template_dir', 'template/')
        self.output_dir = paths.get('output_dir', 'output/')

    def prepare(self):
        # 1. Проверяем картинки
        files = os.listdir(self.in_images)
        self.images = sorted(
            [os.path.join(self.in_images, f) for f in files if f.lower().endswith(('.png', '.jpg'))],
            key=natural_sort_key
        )
        if not self.images: raise ValueError("Нет картинок!")
        
        # 2. Проверяем голос
        audio_files = [os.path.join(self.in_voice, f) for f in os.listdir(self.in_voice) if f.lower().endswith(('.mp3', '.wav'))]
        if not audio_files: raise ValueError("Нет файла озвучки!")
        self.voice = audio_files[0]
        
        # 3. Проверка шаблона
        if not os.path.exists(os.path.join(self.template_dir, 'draft_content.json')):
            raise ValueError(f"В папке {self.template_dir} нет файла draft_content.json!")

    def build_project(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        project_name = f"Draft_{timestamp}"
        new_proj_path = os.path.join(self.output_dir, project_name)
        
        # 1. КОПИРУЕМ ШАБЛОН! (Вот тут магия)
        print(f"📁 Копирую шаблон в папку: {new_proj_path}")
        shutil.copytree(self.template_dir, new_proj_path, dirs_exist_ok=True)
        
        content_path = os.path.join(new_proj_path, 'draft_content.json')
        meta_path = os.path.join(new_proj_path, 'draft_meta_info.json')

        # 2. Считаем таймлайн
        timings = get_dummy_timings()
        timeline, total_dur = build_timeline(self.config, timings, self.images)
        print(f"📐 Математика: ролик будет длиться {total_dur / MICROSEC:.2f} сек.")

        # 3. Модификация JSON
        with open(content_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Обрабатываем видео/картинки
        video_track = next((t for t in data['tracks'] if t['type'] == 'video'), None)
        blueprint_seg = copy.deepcopy(video_track['segments'][0])
        blueprint_mat_id = blueprint_seg['material_id']
        blueprint_mat = next((m for m in data['materials']['videos'] if m['id'] == blueprint_mat_id), None)

        data['materials']['videos'] = [m for m in data['materials']['videos'] if m.get('type') != 'photo']
        video_track['segments'] = []

        for chunk in timeline:
            new_mat_id = generate_id()
            new_seg_id = generate_id()
            
            mat = copy.deepcopy(blueprint_mat)
            mat['id'] = new_mat_id
            mat['path'] = os.path.abspath(chunk['image_path']).replace('\\', '/')
            mat['material_name'] = os.path.basename(chunk['image_path'])
            data['materials']['videos'].append(mat)
            
            seg = copy.deepcopy(blueprint_seg)
            seg['id'] = new_seg_id
            seg['material_id'] = new_mat_id
            seg['target_timerange']['start'] = chunk['start_us']
            seg['target_timerange']['duration'] = chunk['duration_us']
            seg['source_timerange']['duration'] = chunk['duration_us']
            video_track['segments'].append(seg)

        # Обрабатываем эффекты (шум)
        effect_track = next((t for t in data['tracks'] if t['type'] == 'effect'), None)
        if effect_track:
            for ef_seg in effect_track['segments']:
                ef_seg['target_timerange']['start'] = 0
                ef_seg['target_timerange']['duration'] = total_dur
                
                # ФИКС: Проверяем, что значение существует и не равно None
                if ef_seg.get('source_timerange'):
                    ef_seg['source_timerange']['duration'] = total_dur

        # Обрабатываем аудио (ставим твой veter.mp3)
        audio_tracks = [t for t in data['tracks'] if t['type'] == 'audio']
        if audio_tracks and audio_tracks[0]['segments']:
            voice_seg = audio_tracks[0]['segments'][0]
            voice_seg['target_timerange']['start'] = 0
            voice_seg['target_timerange']['duration'] = total_dur
            voice_seg['source_timerange']['duration'] = total_dur
            
            for m in data['materials']['audios']:
                if m['id'] == voice_seg['material_id']:
                    m['path'] = os.path.abspath(self.voice).replace('\\', '/')
                    m['name'] = os.path.basename(self.voice)
                    m['duration'] = total_dur

        data['duration'] = total_dur
        with open(content_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # 4. Обновляем мету (иначе CapCut не покажет длину проекта)
        if os.path.exists(meta_path):
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
            meta['tm_duration'] = total_dur
            meta['draft_name'] = project_name
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)

        print(f"✅ Готово! Проект собран.")
        print(f"👉 Скопируй папку {new_proj_path} в свои черновики CapCut и проверь результат!")

if __name__ == "__main__":
    app = AutoVideoMaker()
    app.prepare()
    app.build_project()