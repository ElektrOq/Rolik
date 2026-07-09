import os

class ScriptParser:
    def __init__(self):
        """
        Парсер сценария. 
        Его единственная задача — прочитать текстовый файл и структурировать данные.
        Больше он никуда не лезет и ничего не скачивает.
        """
        pass

    def parse(self, file_path):
        """
        Читает текстовый файл с разметкой (ГЛАВА, [1.jpg], текст).
        Возвращает готовый список словарей для main.py.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"❌ Файл сценария {file_path} не найден!")

        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        chapters = []
        current_chapter = None
        current_slide = None
        chapter_counter = 1

        for line in lines:
            line = line.strip()
            if not line:
                continue # Пропускаем пустые строки

            # Если находим начало новой главы
            if line.upper().startswith("ГЛАВА"):
                # Называем главу просто chapter_1, chapter_2 и т.д. для сохранения mp3
                current_chapter = {"name": f"chapter_{chapter_counter}", "slides": []}
                chapters.append(current_chapter)
                chapter_counter += 1
                
            # Если находим картинку в квадратных скобках (например, [1.jpg])
            elif line.startswith("[") and line.endswith("]"):
                image_name = line[1:-1] # Убираем скобки
                current_slide = {"image": image_name, "text": ""}
                
                if current_chapter is not None:
                    current_chapter["slides"].append(current_slide)
            
            # Все остальные строки — это текст для текущего слайда
            else:
                if current_slide is not None:
                    # Добавляем пробел, чтобы слова с разных строк не слиплись
                    current_slide["text"] += line + " "

        # В конце проходимся и убираем лишние пробелы по краям текста
        for ch in chapters:
            for sl in ch["slides"]:
                sl["text"] = sl["text"].strip()

        return chapters