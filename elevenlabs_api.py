import os
import requests
import time
import zipfile
import io
import json

class ElevenLabsAPI:
    def __init__(self, api_key, voice_id, model_id="eleven_multilingual_v2", template_uuid=None):
        self.api_key = api_key
        self.voice_id = voice_id
        self.model_id = model_id
        self.template_uuid = template_uuid
        self.base_url = "https://voiceapi.csv666.ru"

    def generate_audio_with_timestamps(self, text, output_path):
        headers = {"X-API-Key": self.api_key, "Content-Type": "application/json"}
        
        print(f"\n📡 [API] Отправка текста ({len(text)} симв.) на генерацию...")
        
        # Строгое разделение: либо шаблон, либо настройки
        payload = {"text": text}
        
        if self.template_uuid:
            payload["template_uuid"] = self.template_uuid
            print(f"🎭 [API] Используем готовый шаблон: {self.template_uuid}")
        else:
            payload["template"] = {
                "voice_id": self.voice_id, 
                "model_id": self.model_id,
                "subtitles": True
            }
            print(f"⚙️ [API] Используем настройки голоса: {self.voice_id}")
        
        resp = requests.post(f"{self.base_url}/tasks", json=payload, headers=headers)
        if resp.status_code != 200:
            raise Exception(f"Ошибка API при создании задачи: {resp.text}")
            
        task_id = resp.json().get("task_id")
        print(f"⏳ [API] Задача {task_id} создана. Ожидание обработки...")
        
        attempts = 0
        while True:
            time.sleep(3)
            attempts += 1
            status_resp = requests.get(f"{self.base_url}/tasks/{task_id}/status", headers=headers)
            status_data = status_resp.json()
            status = status_data.get("status")
            
            if status == "ending":
                print("✅ [API] Сервер закончил генерацию!")
                break
            elif status == "error":
                raise Exception(f"Сервер выдал ошибку: {status_data}")
            
            if attempts > 60:
                raise Exception("Таймаут ожидания сервера.")

        print(f"📡 [API] Скачивание результата...")
        result_resp = requests.get(f"{self.base_url}/tasks/{task_id}/result", headers=headers)
        content = result_resp.content
        
        subtitles_data = {}

        # Проверяем, прислал ли сервер ZIP-архив (если запрос был без UUID)
        if content.startswith(b'PK\x03\x04'):
            print("🗂 [API] Сервер прислал ZIP-архив! Извлекаем...")
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                for filename in z.namelist():
                    if filename.endswith(".mp3"):
                        with open(output_path, "wb") as f:
                            f.write(z.read(filename))
                        print(f"   ✅ MP3 успешно извлечен!")
                    elif filename.endswith(".json"):
                        try:
                            subtitles_data = json.loads(z.read(filename).decode('utf-8'))
                            print(f"   ✅ JSON тайминги извлечены!")
                        except: pass
                    elif filename.endswith(".srt"):
                        subtitles_data = {"srt": z.read(filename).decode('utf-8')}
                        print(f"   ✅ SRT субтитры извлечены!")
            return subtitles_data
        else:
            # Сервер прислал просто аудио (потому что мы использовали шаблон)
            print("🎵 [API] Сервер прислал обычный MP3 файл.")
            with open(output_path, "wb") as f:
                f.write(content)
            
            # ДОПОЛНИТЕЛЬНЫЙ ЗАПРОС: Пытаемся вытянуть субтитры насильно
            print(f"📡 [API] Пытаюсь получить субтитры отдельным запросом...")
            sub_resp = requests.get(f"{self.base_url}/tasks/{task_id}/subtitles", headers=headers)
            
            if sub_resp.status_code == 200:
                sub_text = sub_resp.text.strip()
                if sub_text.startswith("1\n00:00"): # Проверка, что это SRT формат
                    print("✅ SRT субтитры получены отдельным запросом!")
                    return {"srt": sub_text}
                else:
                    try:
                        data = sub_resp.json()
                        print("✅ JSON субтитры получены отдельным запросом!")
                        return data
                    except:
                        print("⚠️ Сервер вернул странный формат субтитров.")
            else:
                print(f"⚠️ Субтитры не найдены (Код {sub_resp.status_code}). Будет использовано равномерное распределение.")

            return {}