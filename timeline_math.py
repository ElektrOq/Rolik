import math

class TimelineMath:
    def __init__(self, config):
        """
        Инициализация математического модуля.
        На вход принимает словарь с настройками из config.yaml.
        """
        self.config = config
        self.microsec = 1_000_000 # Константа для CapCut

    def build_timeline(self, timings, image_files):
        """
        Строит итоговый таймлайн для видео.
        :param timings: Массив словарей [{'word': '...', 'start': 0.0, 'end': 0.5}, ...]
        :param image_files: Список путей к отсортированным картинкам
        :return: list(готовые блоки для картинок), int(общая длина видео в микросекундах)
        """
        if not timings or not image_files:
            raise ValueError("Нет данных для сборки (пустые тайминги или картинки).")

        # Достаем настройки из конфига
        min_duration = self.config['video'].get('min_image_duration', 1.2)
        pad_start = self.config['video'].get('padding_start', 0.3)
        pad_end = self.config['video'].get('padding_end', 1.0)
        loop_images = self.config['automation'].get('loop_images', True)

        chunks = []
        
        # Начало первого кадра (сдвигаем назад на величину padding_start, но не меньше 0)
        current_start = max(0.0, timings[0]['start'] - pad_start)
        
        for i, timing in enumerate(timings):
            is_last_word = (i == len(timings) - 1)
            
            # Текущая длительность блока
            current_duration = timing['end'] - current_start
            
            # Если набрали нужное время (min_duration) ИЛИ это последнее слово в аудио
            if current_duration >= min_duration or is_last_word:
                current_end = timing['end']
                
                # Если это последний кусок, прибавляем к нему время задержки в конце
                if is_last_word:
                    current_end += pad_end
                    
                # Записываем готовый блок
                chunks.append({
                    'start_sec': current_start,
                    'end_sec': current_end,
                    'duration_sec': current_end - current_start,
                    
                    # Сразу считаем микросекунды для CapCut (должны быть строго целыми числами)
                    'start_us': int(current_start * self.microsec),
                    'duration_us': int((current_end - current_start) * self.microsec)
                })
                
                # Следующий блок начнется ровно там, где закончился этот
                if not is_last_word:
                    current_start = current_end

        # Теперь присваиваем картинки к нашим временным блокам
        final_timeline = []
        for i, chunk in enumerate(chunks):
            # Если картинок хватает — берем по порядку
            if i < len(image_files):
                img_path = image_files[i]
            else:
                # Если блоков больше, чем картинок
                if loop_images:
                    # Зацикливаем (начинаем с первой)
                    img_path = image_files[i % len(image_files)]
                else:
                    # Замораживаем последнюю картинку до конца аудио
                    img_path = image_files[-1] 
            
            chunk_data = chunk.copy()
            chunk_data['image_path'] = img_path
            final_timeline.append(chunk_data)

        # Высчитываем общую длину всего видео (конец последнего блока)
        total_duration_us = int(chunks[-1]['end_sec'] * self.microsec)

        print(f"📐 Таймлайн рассчитан: {len(final_timeline)} кадров. Общая длина: {chunks[-1]['end_sec']:.2f} сек.")
        
        return final_timeline, total_duration_us

# ==========================================
# ТЕСТ МОДУЛЯ
# ==========================================
if __name__ == "__main__":
    # Фейковый конфиг для теста
    test_config = {
        'video': {'min_image_duration': 1.0, 'padding_start': 0.2, 'padding_end': 1.0},
        'automation': {'loop_images': True}
    }
    
    # Фейковые слова (идут очень быстро)
    test_timings = [
        {"word": "Раз", "start": 0.5, "end": 0.8},
        {"word": "два", "start": 0.8, "end": 1.1},
        {"word": "три", "start": 1.1, "end": 1.4},
        {"word": "четыре", "start": 1.4, "end": 2.5}
    ]
    
    # Фейковые картинки (всего 2 штуки, а слов 4)
    test_images = ["input/images/1.jpg", "input/images/2.jpg"]
    
    math_module = TimelineMath(test_config)
    timeline, total_dur = math_module.build_timeline(test_timings, test_images)
    
    for idx, item in enumerate(timeline):
        print(f"Кадр {idx+1} [{item['image_path']}]: {item['start_sec']:.2f}s -> {item['end_sec']:.2f}s (Длина: {item['duration_sec']:.2f}s)")