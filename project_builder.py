import os
import json
import uuid
import shutil
import copy

class ProjectBuilder:
    def __init__(self, template_dir, new_project_path):
        self.template_dir = template_dir
        self.new_project_path = new_project_path

    def _generate_id(self):
        return str(uuid.uuid4()).upper()

    def build(self, timeline, audio_timeline, total_duration_us):
        print(f"🛠 Начинаю сборку проекта CapCut...")

        shutil.copytree(self.template_dir, self.new_project_path, dirs_exist_ok=True)

        content_path = os.path.join(self.new_project_path, 'draft_content.json')
        meta_path = os.path.join(self.new_project_path, 'draft_meta_info.json')

        with open(content_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)

        # Ищем дорожки
        video_track = next((t for t in data['tracks'] if t['type'] == 'video'), None)
        audio_tracks = [t for t in data['tracks'] if t['type'] == 'audio']

        # Умный поиск голоса (самый короткий кусок аудио в шаблоне)
        voice_track = None
        min_duration = float('inf')
        for t in audio_tracks:
            if not t['segments']: continue
            mat_id = t['segments'][0]['material_id']
            mat = next((m for m in data['materials']['audios'] if m['id'] == mat_id), None)
            if mat and mat['duration'] < min_duration:
                min_duration = mat['duration']
                voice_track = t

        blueprint_segments = copy.deepcopy(video_track['segments'])
        blueprint_voice_seg = copy.deepcopy(voice_track['segments'][0]) if voice_track and voice_track['segments'] else None
        
        new_meta_materials = []

        # ==========================================
        # 1. ОБРАБОТКА КАРТИНОК И ИХ АНИМАЦИЙ
        # ==========================================
        video_track['segments'] = []
        old_video_materials = {m['id']: m for m in data['materials']['videos']}
        
        # Вытаскиваем все анимации (Зум и т.д.) из базы шаблона
        animations_dict = {m['id']: m for m in data['materials'].get('material_animations', [])}
        
        # Чистим старые картинки
        data['materials']['videos'] = [m for m in data['materials']['videos'] if m.get('metetype') != 'photo']
        
        for i, chunk in enumerate(timeline):
            bp_seg = blueprint_segments[i % len(blueprint_segments)]
            seg = copy.deepcopy(bp_seg)
            seg['id'] = self._generate_id()
            
            old_mat = old_video_materials.get(bp_seg['material_id'])
            new_mat_id = self._generate_id()
            
            if old_mat:
                mat = copy.deepcopy(old_mat)
                mat['id'] = new_mat_id
                mat['path'] = chunk['path']
                mat['material_name'] = chunk['image']
                mat['duration'] = chunk['duration_us']
                data['materials']['videos'].append(mat)
            else:
                mat = {"id": new_mat_id, "path": chunk['path'], "material_name": chunk['image'], "type": 0, "metetype": "photo", "duration": chunk['duration_us']}
                data['materials']['videos'].append(mat)

            seg['material_id'] = new_mat_id
            seg['target_timerange'] = {'start': chunk['start_us'], 'duration': chunk['duration_us']}
            seg['source_timerange'] = {'start': 0, 'duration': chunk['duration_us']}
            
            # УМНАЯ ОБРАБОТКА АНИМАЦИЙ (Зум 1 и т.д.)
            new_extra_refs = []
            for ref_id in bp_seg.get('extra_material_refs', []):
                if ref_id in animations_dict:
                    # Если это анимация — клонируем её и меняем скорость под новый слайд
                    old_anim = animations_dict[ref_id]
                    new_anim = copy.deepcopy(old_anim)
                    new_anim_id = self._generate_id()
                    new_anim['id'] = new_anim_id
                    
                    if 'animations' in new_anim:
                        for a in new_anim['animations']:
                            a['duration'] = chunk['duration_us'] # Подгоняем скорость
                            
                    data['materials']['material_animations'].append(new_anim)
                    new_extra_refs.append(new_anim_id)
                else:
                    # Остальные фильтры (цветокоррекция) не зависят от времени, оставляем как есть
                    new_extra_refs.append(ref_id)
            
            seg['extra_material_refs'] = new_extra_refs
            video_track['segments'].append(seg)

            new_meta_materials.append({
                "id": new_mat_id,
                "file_Path": chunk['path'],
                "extra_info": chunk['image'],
                "metetype": "photo",
                "type": 0,
                "duration": chunk['duration_us']
            })

        # ==========================================
        # 2. ОБРАБОТКА АУДИО (Голос)
        # ==========================================
        if voice_track and blueprint_voice_seg:
            old_voice_mat_id = blueprint_voice_seg['material_id']
            old_voice_mat = next((m for m in data['materials']['audios'] if m['id'] == old_voice_mat_id), None)
            data['materials']['audios'] = [m for m in data['materials']['audios'] if m['id'] != old_voice_mat_id]
            voice_track['segments'] = []

            for aud in audio_timeline:
                new_aud_mat_id = self._generate_id()
                new_aud_seg_id = self._generate_id()
                
                if old_voice_mat:
                    aud_mat = copy.deepcopy(old_voice_mat)
                    aud_mat['id'] = new_aud_mat_id
                    aud_mat['path'] = aud['path']
                    aud_mat['name'] = aud['name']
                    aud_mat['duration'] = aud['duration_us']
                    data['materials']['audios'].append(aud_mat)
                else:
                    aud_mat = {"id": new_aud_mat_id, "path": aud['path'], "name": aud['name'], "type": 0, "metetype": "audio", "duration": aud['duration_us']}
                    data['materials']['audios'].append(aud_mat)

                aud_seg = copy.deepcopy(blueprint_voice_seg)
                aud_seg['id'] = new_aud_seg_id
                aud_seg['material_id'] = new_aud_mat_id
                aud_seg['target_timerange'] = {'start': aud['start_us'], 'duration': aud['duration_us']}
                aud_seg['source_timerange'] = {'start': 0, 'duration': aud['duration_us']}
                voice_track['segments'].append(aud_seg)

                new_meta_materials.append({
                    "id": new_aud_mat_id,
                    "file_Path": aud['path'],
                    "extra_info": aud['name'],
                    "metetype": "music",
                    "type": 0,
                    "duration": aud['duration_us']
                })

        # ==========================================
        # 3. МУЗЫКА И ЭФФЕКТЫ
        # ==========================================
        for t in audio_tracks:
            if t != voice_track and t['segments']:
                first_seg = t['segments'][0] 
                first_seg['target_timerange'] = {'start': 0, 'duration': total_duration_us}
                if first_seg.get('source_timerange'):
                    first_seg['source_timerange']['duration'] = total_duration_us
                t['segments'] = [first_seg] 

        for track in data['tracks']:
            if track['type'] in ['effect', 'filter', 'sticker']:
                for ef_seg in track['segments']:
                    ef_seg['target_timerange']['start'] = 0
                    ef_seg['target_timerange']['duration'] = total_duration_us
                    if ef_seg.get('source_timerange'):
                        ef_seg['source_timerange']['duration'] = total_duration_us

        data['duration'] = total_duration_us
        with open(content_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # ==========================================
        # 4. ОБНОВЛЕНИЕ МЕТАДАТЫ
        # ==========================================
        meta['tm_duration'] = total_duration_us
        meta['draft_name'] = os.path.basename(self.new_project_path)
        
        meta_materials_array = meta.get('draft_materials', [])
        if meta_materials_array:
            type_0_group = next((g for g in meta_materials_array if g['type'] == 0), None)
            if type_0_group:
                keep_vals = []
                for v in type_0_group['value']:
                    if v.get('metetype') == 'photo': continue
                    if voice_track and blueprint_voice_seg and v.get('id') == blueprint_voice_seg['material_id']: continue
                    keep_vals.append(v)
                
                keep_vals.extend(new_meta_materials)
                type_0_group['value'] = keep_vals

        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

        print("✅ Проект собран, метаданные обновлены, баги устранены!")