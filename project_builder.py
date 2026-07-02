import os
import re
import yaml
from datetime import datetime

# Импортируем наши кирпичики (убедись, что файлы лежат в той же папке)
from audio_processor import AudioProcessor
from timeline_math import TimelineMath
from project_builder import ProjectBuilder

def natural_sort_key(s):
    """Сортировка файлов для правильного порядка: 1.jpg, 2.jpg ... 10.jpg"""
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split(r'(\d+)', s)]

class AutoVideoMaker:
    def __init__(self, config_path="config.yaml"):
        self.config_path = config_path
        self.config = self._load_config()
        
        self.paths = self.config.get('paths', {})
        self.input_images_dir = self.paths.get('input_images', 'input/images/')
        self.input_voice_dir = self.paths.get('input_voice', 'input/voice/')
        self.template_dir = self.paths.get('template_dir', 'template/')
        self.output_dir = self.paths.get('output_dir', 'output/')
        
        self.image_files = []
        self.voice_file = None

    def _load_config(self):
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Файл {self.config_path} не найден!")
        with open(self.config_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)

    def prepare_workspace(self):
        print("🔍 Сканирую папки с исходниками...")

        # 1. Картинки
        valid_img_ext = ('.png', '.jpg', '.jpeg')
        if os.path.exists(self.input_images_dir):
            files = os.listdir(self.input_images_dir)
            self.image_files = sorted(
                [os.path.join(self.input_images_dir, f) for f in files if f.lower().endswith(valid_img_ext)],
                key=natural_sort_key
            )
        if not self.image_files:
            raise ValueError(f"❌ В папке {self.input_images_dir} нет картинок!")
        print(f"✅ Найдено картинок: {len(self.image_files)}")

        # 2. Озвучка
        valid_aud_ext = ('.mp3', '.wav', '.m4a')
        if os.path.exists(self.input_voice_dir):
            files = os.listdir(self.input_voice_dir)
            audio_files = [os.path.join(self.input_voice_dir, f) for f in files if f.lower().endswith(valid_aud_ext)]
            if audio_files:
                self.voice_file = audio_files[0]
        if not self.voice_file:
            raise ValueError(f"❌ В папке {self.input_voice_dir} нет файла озвучки!")
        print(f"✅ Файл озвучки: {os.path.basename(self.voice_file)}")

        return True

    def create_new_project_folder(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        project_name = f"Draft_{timestamp}"
        new_project_path = os.path.join(self.output_dir, project_name)
        os.makedirs(new_project_path, exist_ok=True)
        return new_project_path

    def run(self):
        """Главный метод, запускающий весь процесс"""
        print("🚀 Запуск AutoVideoMaker...\n" + "="*40)
        
        try:
            # 1. Подготовка файлов
            self.prepare_workspace()
            
            # 2. Получение таймингов (пока через заглушку)
            audio_proc = AudioProcessor()
            timings = audio_proc.get_word_timings_dummy(self.voice_file)
            
            # 3. Расчет математики кадров
            math_mod = TimelineMath(self.config)
            timeline, total_dur_us = math_mod.build_timeline(timings, self.image_files)
            
            # 4. Сборка проекта CapCut
            new_proj_path = self.create_new_project_folder()
            builder = ProjectBuilder(self.template_dir, new_project_path)
            
            # Передаем методу build путь к новой папке, рассчитанный таймлайн, общую длину и звук
            builder.build(new_proj_path, timeline, total_dur_us, self.voice_file)
            
            print("="*40)
            print(f"🎉 ГОТОВО! Проект сохранен в: {new_proj_path}")
            print(f"Чтобы открыть его, скопируй эту папку в C:/Users/Твой_Юзер/AppData/Local/CapCut/User Data/Projects/com.lveditor.draft/")
            
        except Exception as e:
            print(f"\n❌ Критическая ошибка при сборке: {e}")

if __name__ == "__main__":
    app = AutoVideoMaker()
    app.run()