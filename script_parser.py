import os
import yaml
import base64
import requests

class ScriptParser:
    def __init__(self, config_path="config.yaml"):
        """
        Инициализация парсера. Сразу подгружаем ключи API из конфига.
        """
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

        # Вытаскиваем настройки ElevenLabs
        self.api_key = self.config['elevenlabs']['api_key']
        self.voice_id = self.config['elevenlabs']['voice_id']
        self.model_id = self.config['elevenlabs']['model_id']
        
        # Эндпоинт ElevenLabs, который возвращает звук + тайминги
        self.url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}/with-timestamps"

    def parse_text_file(self, file_path):
        """
        Читает твой кастомный текстовый файл.
        Превращает его в список словарей с главами и слайдами.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл сценария {file_path} не найден!")

        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        chapters = []
        current_chapter = None
        current_slide = None

        for line in lines:
            line = line.strip()
            if not line:
                continue # Пропускаем пустые строки

            # Если находим начало новой главы
            if line.upper().startswith("ГЛАВА"):
                current_chapter = {"name": line, "slides": []}
                chapters.append(current_chapter)
                
            # Если находим картинку в квадратных скобках [1.jpg]
            elif line.startswith("[") and line.endswith("]"):
                image_name = line[1:-1] # Вырезаем текст без скобок
                current_slide = {"image": image_name, "text": ""}
                
                # Привязываем слайд к текущей главе
                if current_chapter is not None:
                    current_chapter["slides"].append(current_slide)
            
            # Все остальные строки — это текст для текущего слайда
            else:
                if current_slide is not None:
                    # Добавляем пробел, чтобы слова не слиплись при склейке строк
                    current_slide["text"] += line + " "

        # Чистим пробелы по краям текста каждого слайда
        for ch in chapters:
            for sl in ch["slides"]:
                sl["text"] = sl["text"].strip()

        return chapters

    def process_chapter(self, chapter, output_audio_path):
        """
        Берет 1 главу, отправляет ее текст в ElevenLabs, скачивает MP3
        и вычисляет точные тайминги каждого слайда по символам.
        """
        print(f"🎙 Отправляю в ElevenLabs: {chapter['name']} ...")

        # 1. Склеиваем текст всех слайдов главы через 1 пробел.
        # Это критически важно для математики символов ниже!
        slide_texts = [slide["text"] for slide in chapter["slides"]]
        full_chapter_text = " ".join(slide_texts)

        # 2. Формируем запрос к ElevenLabs
        payload = {
            "text": full_chapter_text,
            "model_id": self.model_id,
        }
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }

        # Выполняем запрос
        response = requests.post(self.url, json=payload, headers=headers)
        if response.status_code != 200:
            raise Exception(f"❌ Ошибка ElevenLabs: {response.text}")

        res_data = response.json()

        # 3. Сохраняем аудиофайл в папку
        audio_bytes = base64.b64decode(res_data["audio_base64"])
        with open(output_audio_path, "wb") as f:
            f.write(audio_bytes)
        print(f"✅ Аудио сохранено: {os.path.basename(output_audio_path)}")

        # 4. ВЫСШИЙ ПИЛОТАЖ: Сопоставление слайдов по символам.
        # ElevenLabs возвращает массивы для каждой буквы.
        starts = res_data["alignment"]["character_start_times_seconds"]
        ends = res_data["alignment"]["character_end_times_seconds"]

        chapter_timeline = []
        current_char_idx = 0

        for slide in chapter["slides"]:
            slide_len = len(slide["text"])

            if slide_len == 0:
                continue # Защита, если у слайда нет текста

            # Начало слайда — это время первой буквы в его тексте
            start_idx = current_char_idx
            # Конец слайда — это время последней буквы в его тексте
            end_idx = current_char_idx + slide_len - 1

            slide_start_time = starts[start_idx]
            slide_end_time = ends[end_idx]

            chapter_timeline.append({
                "image_file": slide["image"],
                "start_sec": slide_start_time,
                "end_sec": slide_end_time,
                "duration_sec": slide_end_time - slide_start_time
            })

            # Сдвигаем индекс вперед. 
            # "+1" — это тот самый пробел между текстами, который мы добавили при склейке (строка 65)
            current_char_idx += slide_len + 1

        return chapter_timeline

# ==========================================
# ТЕСТ МОДУЛЯ (Запуск отдельно)
# ==========================================
if __name__ == "__main__":
    # Если хочешь потестить парсер отдельно от CapCut:
    # 1. Создай input/script.txt в корне с твоим форматом текста.
    # 2. Впиши реальный API_KEY в config.yaml.
    # 3. Запусти python script_parser.py
    
    parser = ScriptParser()
    chapters_data = parser.parse_text_file("input/script.txt")
    
    for idx, chapter in enumerate(chapters_data):
        audio_name = f"input/voice/chapter_{idx+1}.mp3"
        
        # Получаем таймлайн для конкретной главы
        timeline = parser.process_chapter(chapter, audio_name)
        
        print(f"\n--- Рассчитанный таймлайн для {chapter['name']} ---")
        for item in timeline:
            print(f"Слайд [{item['image_file']}]: с {item['start_sec']:.2f} сек. по {item['end_sec']:.2f} сек.")