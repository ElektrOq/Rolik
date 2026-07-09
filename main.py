import os
import yaml
import json
import re
import glob
import zipfile
from datetime import datetime

from script_parser import ScriptParser
from elevenlabs_api import ElevenLabsAPI
from project_builder import ProjectBuilder

MICROSEC = 1_000_000

class AutoVideoMaker:
    def __init__(self):
        print("⚙️ Читаем config.yaml...")
        with open("config.yaml", 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

        self.paths = self.config.get('paths', {})
        self.out_dir = self.paths.get('output_dir', 'output/')
        self.img_dir = self.paths.get('input_images', 'input/images/')
        self.voice_dir = self.paths.get('input_voice', 'input/voice/')
        self.template_dir = self.paths.get('template_dir', 'template/')
        self.script_file = self.paths.get('script_file', 'input/script.txt')
        self.offline_dir = os.path.join("input", "offline")
        
        self.bg_audio_filename = self.config.get('filenames', {}).get('bg_audio', None)
        
        os.makedirs(self.offline_dir, exist_ok=True)

        self.elevenlabs = ElevenLabsAPI(
            api_key=self.config['elevenlabs']['api_key'],
            voice_id=self.config['elevenlabs']['voice_id'],
            model_id=self.config['elevenlabs'].get('model_id', 'eleven_multilingual_v2'),
            template_uuid=self.config['elevenlabs'].get('template_uuid')
        )

    def generate_task_id(self):
        return f"Task_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    def _parse_time_str(self, time_str):
        match = re.search(r'(\d+):(\d+):(\d+\.\d+)', time_str)
        if match:
            h, m, s = match.groups()
            return int(h)*3600 + int(m)*60 + float(s)
        return 0.0

    def _parse_srt_vtt(self, text, is_vtt):
        api_words = []
        duration = 0.0
        blocks = re.split(r'\n\n+', text.strip())
        for block in blocks:
            lines = block.split('\n')
            if len(lines) >= 3 or (is_vtt and len(lines) >= 2):
                time_line = ""
                text_lines = ""
                for i, line in enumerate(lines):
                    if '-->' in line:
                        time_line = line
                        text_lines = " ".join(lines[i+1:])
                        break
                
                if not time_line: continue
                
                match = re.search(r'(\d+):(\d+):(\d+)[.,](\d+) --> (\d+):(\d+):(\d+)[.,](\d+)', time_line)
                if match:
                    h1, m1, s1, ms1, h2, m2, s2, ms2 = map(int, match.groups())
                    start_sec = h1*3600 + m1*60 + s1 + ms1/1000.0
                    end_sec = h2*3600 + m2*60 + s2 + ms2/1000.0
                    
                    words = re.findall(r"[^\w']+", text_lines)
                    if words:
                        word_dur = (end_sec - start_sec) / len(words)
                        for i, w in enumerate(words):
                            api_words.append({"word": w, "start": start_sec + i * word_dur, "end": start_sec + (i + 1) * word_dur})
                    duration = max(duration, end_sec)
        return api_words, duration

    def _parse_timings(self, content, ext):
        api_words = []
        duration = 30.0

        if ext == '.json':
            data = json.loads(content) if isinstance(content, str) else content
            if "words" in data:
                for w in data["words"]:
                    api_words.append({"word": w["word"], "start": float(w["start"]), "end": float(w["end"])})
                
                # БЕРЕМ РЕАЛЬНУЮ ФИЗИЧЕСКУЮ ДЛИНУ АУДИОФАЙЛА
                dur = data.get("duration_seconds") or data.get("duration")
                if not dur and api_words:
                    dur = api_words[-1]["end"]
                duration = float(dur) if dur else 30.0
                
            elif "srt" in data:
                api_words, duration = self._parse_srt_vtt(data["srt"], False)
            elif "characters" in data:
                chars = data["characters"]
                starts = data["character_start_times_seconds"]
                ends = data["character_end_times_seconds"]
                cur_w, cur_s = "", None
                for i, char in enumerate(chars):
                    if re.match(r"[\w']", char):
                        if cur_s is None: cur_s = starts[i]
                        cur_w += char
                    else:
                        if cur_w:
                            api_words.append({"word": cur_w, "start": cur_s, "end": ends[i-1]})
                            cur_w, cur_s = "", None
                if cur_w:
                    api_words.append({"word": cur_w, "start": cur_s, "end": ends[-1]})
                    
                dur = data.get("duration_seconds") or data.get("duration")
                if not dur and ends:
                    dur = ends[-1]
                duration = float(dur) if dur else 30.0

        elif ext in ['.srt', '.vtt']:
            api_words, duration = self._parse_srt_vtt(content, ext == '.vtt')
            
        elif ext == '.ass':
            lines = content.split('\n')
            for line in lines:
                if line.startswith('Dialogue:'):
                    parts = line.split(',', 9)
                    if len(parts) >= 10:
                        start_str, end_str = parts[1], parts[2]
                        text = parts[9].replace(r'\N', ' ').replace(r'\n', ' ')
                        start_sec = self._parse_time_str(start_str)
                        end_sec = self._parse_time_str(end_str)
                        words = re.findall(r"[\w']+", text)
                        if words:
                            word_dur = (end_sec - start_sec) / len(words)
                            for i, w in enumerate(words):
                                api_words.append({"word": w, "start": start_sec + i * word_dur, "end": start_sec + (i + 1) * word_dur})
                        duration = max(duration, end_sec)
        
        return api_words, duration

    def run(self):
        print("========================================")
        print("ВЫБЕРИТЕ РЕЖИМ РАБОТЫ:")
        print("1 - API (Онлайн генерация ElevenLabs)")
        print("2 - АРХИВЫ (Офлайн из папки input/offline/)")
        print("========================================")
        mode = input("Ваш выбор (1 или 2): ").strip()
        
        if mode not in ['1', '2']:
            print("❌ Неверный выбор. Завершение работы.")
            return

        print("\n🚀 Запуск генерации контента...\n" + "="*40)
        task_id = self.generate_task_id()
        task_folder = os.path.join(self.out_dir, task_id)
        os.makedirs(task_folder, exist_ok=True)

        result_log = {"task_id": task_id, "created_at": str(datetime.now()), "total_duration_sec": 0, "chapters": []}
        global_timeline, audio_timeline = [], []
        
        global_time_offset = 0.0 

        try:
            parser = ScriptParser()
            chapters = parser.parse(self.script_file)

            for ch in chapters:
                chapter_name = ch['name']
                print(f"\n⚙️ Обработка: {chapter_name}")

                slide_texts = [s['text'] for s in ch['slides']]
                full_text = " ".join(slide_texts)
                if not full_text.strip(): continue

                api_words = []
                chapter_duration = 30.0
                current_img_dir = self.img_dir
                mp3_path = os.path.join(self.voice_dir, f"{chapter_name}.mp3")

                if mode == '1':
                    api_result = self.elevenlabs.generate_audio_with_timestamps(full_text, mp3_path)
                    with open(os.path.join(task_folder, f"debug_{chapter_name}.json"), 'w', encoding='utf-8') as f:
                        json.dump(api_result, f, ensure_ascii=False, indent=2)
                    
                    api_words, chapter_duration = self._parse_timings(api_result, '.json')

                elif mode == '2':
                    ch_num_match = re.search(r'\d+', chapter_name)
                    ch_num = ch_num_match.group() if ch_num_match else chapter_name
                    
                    archive_path = os.path.join(self.offline_dir, f"{ch_num}.zip")
                    if not os.path.exists(archive_path):
                        archive_path = os.path.join(self.offline_dir, f"{chapter_name}.zip")
                        
                    if os.path.exists(archive_path):
                        archive_name = os.path.splitext(os.path.basename(archive_path))[0]
                        extract_dir = os.path.join(task_folder, f"offline_{archive_name}")
                        print(f"📦 Распаковываю архив: {archive_path} в {extract_dir}")
                        os.makedirs(extract_dir, exist_ok=True)
                        
                        with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                            zip_ref.extractall(extract_dir)
                            
                        mp3_files = glob.glob(os.path.join(extract_dir, "*.mp3"))
                        if mp3_files: 
                            mp3_path = mp3_files[0]
                            print(f"🎵 Звук найден: {os.path.basename(mp3_path)}")
                            
                        timing_files = glob.glob(os.path.join(extract_dir, "*.json")) + \
                                       glob.glob(os.path.join(extract_dir, "*.srt")) + \
                                       glob.glob(os.path.join(extract_dir, "*.vtt")) + \
                                       glob.glob(os.path.join(extract_dir, "*.ass"))
                                       
                        if timing_files:
                            timing_file = timing_files[0]
                            ext = os.path.splitext(timing_file)[1].lower()
                            print(f"⏱ Найден файл таймингов: {os.path.basename(timing_file)}")
                            
                            with open(timing_file, 'r', encoding='utf-8') as tf:
                                content = tf.read()
                            api_words, chapter_duration = self._parse_timings(content, ext)
                    else:
                        print(f"⚠️ Архив для {chapter_name} не найден! Использую равномерное распределение.")

                audio_timeline.append({
                    "path": os.path.abspath(mp3_path).replace('\\', '/'),
                    "name": os.path.basename(mp3_path),
                    "start_us": int(global_time_offset * MICROSEC),
                    "duration_us": int(chapter_duration * MICROSEC)
                })

                chapter_log = {"name": chapter_name, "audio": os.path.basename(mp3_path), "slides": []}

                api_clean = []
                api_mapping = []
                if api_words:
                    for idx, w in enumerate(api_words):
                        cleaned = re.sub(r"[^\w']", '', w['word'].lower())
                        if cleaned:
                            api_clean.append(cleaned)
                            api_mapping.append(idx)

                if api_clean:
                    print("🎯 Сканер синхронизации активен...")
                    slide_starts = [0.0] * len(ch['slides'])
                    slide_starts[0] = api_words[0]['start']
                    current_clean_idx = 0
                    
                    for i in range(1, len(ch['slides'])):
                        prev_slide = ch['slides'][i-1]
                        prev_raw = re.sub(r'\[.*?\]', '', prev_slide['text'])
                        prev_raw = re.sub(r'(?i)ГЛАВА\s*-\s*\d+', '', prev_raw)
                        prev_words = [re.sub(r"[^\w']", '', w.lower()) for w in prev_raw.split()]
                        prev_words = [w for w in prev_words if w]

                        slide = ch['slides'][i]
                        raw_text = re.sub(r'\[.*?\]', '', slide['text'])
                        raw_text = re.sub(r'(?i)ГЛАВА\s*-\s*\d+', '', raw_text)
                        
                        words = [re.sub(r"[^\w']", '', w.lower()) for w in raw_text.split()]
                        words = [w for w in words if w]
                        
                        if not words:
                            slide_starts[i] = slide_starts[i-1]
                            continue
                            
                        # Сдвигаем радар на 30% слов прошлого слайда, чтобы не цеплять прошлый текст
                        jump = max(1, int(len(prev_words) * 0.3))
                        current_clean_idx += jump
                        if current_clean_idx >= len(api_clean):
                            current_clean_idx = len(api_clean) - 1

                        found_idx = current_clean_idx
                        found = False
                        
                        # Ищем точное совпадение
                        for L in [4, 3, 2]:
                            if found: break
                            for shift in range(min(15, len(words))):
                                if found: break
                                prefix = words[shift : shift+L]
                                if len(prefix) < L: continue
                                
                                search_limit = min(current_clean_idx + 600, len(api_clean) - L + 1)
                                if L == 2: search_limit = min(current_clean_idx + 150, len(api_clean) - L + 1)
                                    
                                for j in range(current_clean_idx, search_limit):
                                    if api_clean[j:j+L] == prefix:
                                        found_idx = max(current_clean_idx, j - shift)
                                        found = True
                                        break
                                        
                        # Если не нашли цепочку, ищем хотя бы одно длинное уникальное слово из начала
                        if not found:
                            for shift in range(min(10, len(words))):
                                if found: break
                                word = words[shift]
                                if len(word) <= 3: continue 
                                
                                search_limit = min(current_clean_idx + 150, len(api_clean))
                                for j in range(current_clean_idx, search_limit):
                                    if api_clean[j] == word:
                                        found_idx = max(current_clean_idx, j - shift)
                                        found = True
                                        break

                        if found:
                            real_api_idx = api_mapping[found_idx]
                            slide_starts[i] = api_words[real_api_idx]['start']
                            current_clean_idx = found_idx
                        else:
                            # ==========================================
                            # ЧЕСТНАЯ ЗАПИСЬ ОШИБОК ДЛЯ РУЧНОЙ ПРАВКИ
                            # ==========================================
                            err_msg = f"⚠️ РАССИНХРОН | Глава: {chapter_name} | Слайд: {slide['image']}\n"
                            err_msg += f"   ➤ Мы искали этот текст: {' '.join(words[:7])}...\n"
                            
                            start_ctx = max(0, current_clean_idx - 5)
                            end_ctx = min(len(api_clean), current_clean_idx + 20)
                            context_json = api_clean[start_ctx:end_ctx]
                            
                            err_msg += f"   ➤ В JSON в этот момент находится: {' '.join(context_json)}\n"
                            err_msg += "-"*60
                            print(err_msg)
                            
                            with open(os.path.join(task_folder, "sync_errors_debug.txt"), "a", encoding="utf-8") as f_err:
                                f_err.write(err_msg + "\n")
                                
                            # Чтобы глобальный таймлайн не посыпался, ставим примерное время (0.3с на слово прошлого слайда)
                            slide_starts[i] = slide_starts[i-1] + (len(prev_words) * 0.3)
                            if slide_starts[i] > chapter_duration:
                                slide_starts[i] = chapter_duration - 1.0
                                
                            # Сдвигаем индекс дальше, чтобы следующий слайд смог зацепиться
                            current_clean_idx = min(current_clean_idx + len(words), len(api_clean) - 1)

                    # Формируем финальные тайминги слайдов для текущей главы
                    for i, slide in enumerate(ch['slides']):
                        local_start = slide_starts[i]
                        
                        if i < len(ch['slides']) - 1:
                            local_end = slide_starts[i+1]
                        else:
                            # Последний слайд строго растягивается до конца физического аудиофайла
                            local_end = chapter_duration
                            
                        # Защита от нулевой или отрицательной длины (чтобы CapCut не крашнулся)
                        if local_end <= local_start:
                            local_end = local_start + 1.0
                            
                        local_duration = local_end - local_start
                        self._add_to_timeline(slide, local_start, local_duration, global_time_offset, global_timeline, chapter_log, current_img_dir)
                        
                else:
                    print("⚠️ Нет данных для синхронизации. Равномерное распределение.")
                    slide_dur = chapter_duration / len(ch['slides'])
                    for i, slide in enumerate(ch['slides']):
                        s_start = i * slide_dur
                        self._add_to_timeline(slide, s_start, slide_dur, global_time_offset, global_timeline, chapter_log, current_img_dir)

                result_log["chapters"].append(chapter_log)
                
                # Прибавляем строгую длину аудиофайла. Следующая глава начнется идеально ровно.
                global_time_offset += chapter_duration

            result_log["total_duration_sec"] = round(global_time_offset, 2)
            total_duration_us = int(global_time_offset * MICROSEC)

            log_path = os.path.join(task_folder, "result_log.json")
            with open(log_path, 'w', encoding='utf-8') as f:
                json.dump(result_log, f, ensure_ascii=False, indent=2)

            print("\n🛠 Начинаю сборку проекта CapCut...")
            
            for item in audio_timeline:
                if 'name' not in item:
                    item['name'] = os.path.basename(item['path'])

            builder = ProjectBuilder(self.template_dir, task_folder)
            builder.build(global_timeline, audio_timeline, total_duration_us)
            
            self._fix_background_audio(task_folder, total_duration_us, extract_dir if mode == '2' and 'extract_dir' in locals() else None)

            print("="*40)
            print(f"🎉 ГОТОВО! Проект собран в папке: {task_folder}")

        except Exception as e:
            print(f"\n❌ Критическая ошибка: {e}")

    def _fix_background_audio(self, task_folder, total_duration_us, archive_extract_dir=None):
        if not self.bg_audio_filename:
            return

        possible_paths = [
            os.path.join("input", self.bg_audio_filename),
            os.path.join("input", "voice", self.bg_audio_filename),
            os.path.join("input", "audio", self.bg_audio_filename),
            self.bg_audio_filename
        ]
        
        if archive_extract_dir:
            possible_paths.append(os.path.join(archive_extract_dir, self.bg_audio_filename))
        
        bg_path_abs = None
        for p in possible_paths:
            if os.path.exists(p):
                bg_path_abs = os.path.abspath(p).replace('\\', '/')
                break
                
        if not bg_path_abs:
            print(f"⚠️ ВНИМАНИЕ: Фоновая музыка '{self.bg_audio_filename}' не найдена!")
            return

        content_path = os.path.join(task_folder, "draft_content.json")
        meta_path = os.path.join(task_folder, "draft_meta_info.json")

        old_bg_ids = []

        if os.path.exists(content_path):
            with open(content_path, 'r', encoding='utf-8') as f:
                content_data = json.load(f)
                
            if "materials" in content_data and "audios" in content_data["materials"]:
                for aud in content_data["materials"]["audios"]:
                    name = aud.get("name", "").lower()
                    if not name.startswith("chapter_") and not name.startswith("result"):
                        old_bg_ids.append(aud["id"])
                        aud["path"] = bg_path_abs
                        aud["name"] = os.path.basename(bg_path_abs)
            
            if old_bg_ids and "tracks" in content_data:
                for track in content_data["tracks"]:
                    if track.get("type") == "audio":
                        for seg in track.get("segments", []):
                            if seg.get("material_id") in old_bg_ids:
                                if "target_timerange" in seg:
                                    seg["target_timerange"]["duration"] = total_duration_us
                                if "source_timerange" in seg:
                                    seg["source_timerange"]["duration"] = total_duration_us

            with open(content_path, 'w', encoding='utf-8') as f:
                json.dump(content_data, f, ensure_ascii=False, indent=2)

        if os.path.exists(meta_path):
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta_data = json.load(f)

            if "draft_materials" in meta_data:
                for mat_group in meta_data["draft_materials"]:
                    if isinstance(mat_group.get("value"), list):
                        for item in mat_group["value"]:
                            if item.get("metetype") == "music":
                                extra_info = item.get("extra_info", "").lower()
                                if not extra_info.startswith("chapter_") and not extra_info.startswith("result"):
                                    item["file_Path"] = bg_path_abs
                                    item["extra_info"] = os.path.basename(bg_path_abs)

            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(meta_data, f, ensure_ascii=False, indent=2)
                
        print(f"🎵 Фон '{self.bg_audio_filename}' успешно вшит поверх старого шаблона!")

    def _add_to_timeline(self, slide, start_sec, dur_sec, offset, timeline, log, custom_img_dir):
        img_name = slide['image'].strip('[]')
        img_path = os.path.join(self.img_dir, img_name)
            
        img_abs_path = os.path.abspath(img_path).replace('\\', '/')
        timeline.append({
            "image": img_name,
            "path": img_abs_path,
            "start_us": int((offset + start_sec) * MICROSEC),
            "duration_us": int(dur_sec * MICROSEC)
        })
        log['slides'].append({
            "image": img_name,
            "start_sec": round(offset + start_sec, 2),
            "duration_sec": round(dur_sec, 2),
            "text": slide['text']
        })

if __name__ == "__main__":
    app = AutoVideoMaker()
    app.run()