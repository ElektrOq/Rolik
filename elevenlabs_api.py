import os
import base64
import requests

class ElevenLabsAPI:
    def __init__(self, api_key, voice_id, model_id="eleven_multilingual_v2"):
        """
        Инициализация модуля ElevenLabs.
        """
        self.api_key = api_key
        self.voice_id = voice_id
        self.model_id = model_id
        # Тот самый эндпоинт, который отдает звук + тайминги
        self.url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}/with-timestamps"

    def generate_audio_with_timestamps(self, text, output_path):
        """
        Отправляет текст, сохраняет аудио в output_path и возвращает alignment (тайминги).
        """
        print(f"🎙 Отправляю запрос в ElevenLabs (Текст: {len(text)} символов)...")
        
        payload = {
            "text": text,
            "model_id": self.model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }

        response = requests.post(self.url, json=payload, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"❌ Ошибка API ElevenLabs: {response.status_code} - {response.text}")

        data = response.json()
        
        # 1. Сохраняем аудио (раскодируем из base64)
        audio_base64 = data.get("audio_base64")
        if not audio_base64:
            raise Exception("❌ ElevenLabs не вернул аудио!")
            
        audio_bytes = base64.b64decode(audio_base64)
        with open(output_path, "wb") as f:
            f.write(audio_bytes)
        print(f"✅ Звук успешно скачан: {os.path.basename(output_path)}")
            
        # 2. Возвращаем сырые посимвольные тайминги (alignment)
        alignment = data.get("alignment")
        if not alignment or not alignment.get("characters"):
            raise Exception("❌ ElevenLabs не вернул посимвольные тайминги!")
            
        return alignment

# ==========================================
# ТЕСТ МОДУЛЯ
# ==========================================
if __name__ == "__main__":
    # Для теста впиши сюда свой реальный ключ
    API_KEY = "ТВОЙ_КЛЮЧ"
    VOICE_ID = "EXAVITQu4vr4xnSDxMaL"
    
    api = ElevenLabsAPI(API_KEY, VOICE_ID)
    
    test_text = "Проверка связи. Раз, два, три."
    timings = api.generate_audio_with_timestamps(test_text, "test_output.mp3")
    
    print("\nСырые данные от ElevenLabs:")
    print("Символы:", timings['characters'])
    print("Начало:", timings['character_start_times_seconds'])
    print("Конец:", timings['character_end_times_seconds'])