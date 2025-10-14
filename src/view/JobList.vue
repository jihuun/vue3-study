<template>
    <div class="xc-player">
        <h2>Bird Sound Player</h2>
        <br></br>
        <label>
            새 이름 검색(영명):
        </label>
        <input v-model="query" @keyup.enter="fetchRecordings" placeholder="예: Parus major" />
        <div>
            <button @click="fetchRecordings">검색</button>
        </div>
        <div class="flex items-center space-x-2">
            <label for="loop-toggle" class="text-sm font-medium">연속 재생</label>
            <input id="loop-toggle" type="checkbox" v-model="isLooping" class="toggle-switch" />
        </div>
        <div v-if="loading">로딩 중...</div>
        <div v-if="error" class="error">에러: {{ error }}</div>

        <div v-if="currentRec" class="player-controls">
            <audio ref="audioEl" :src="audioSrc" preload="auto" @timeupdate="onTimeUpdate" @ended="onEnded"></audio>

            <input type="range" min="0" :max="duration" step="0.1" v-model.number="currentTime" @input="seek" />
            <div>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
            <div>
                <a :href="audioSrc" target="_blank">원본 파일 열기</a>
            </div>
        </div>

        <div v-if="recordings.length > 0" class="recording-list">
            <div v-for="(rec, idx) in recordings" :key="rec.id || idx" class="recording-item">
                <div class="info">
                    <strong>{{ idx + 1 }}.</strong>
                    {{ rec.en || (rec.gen + ' ' + rec.sp) }}
                    — {{ rec.rec }} / {{ rec.loc }}
                    ({{ rec.length }}초)
                </div>
                <div class="controls">
                    <button @click="selectRecording(idx)">
                        {{ currentIndex === idx && playing ? '❚ ❚ 일시정지' : '▶ 재생' }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, reactive, nextTick, onBeforeUnmount, watch } from 'vue'

const query = ref('Great tit')
const loading = ref(false)
const error = ref(null)

const recordings = ref([])  // 검색된 결과 목록
const currentIndex = ref(-1)  // 현재 재생 중인 녹음의 인덱스
const currentRec = ref(null)  // 현재 선택된 녹음 객체

const audioSrc = ref('')
const audioEl = ref(null)
const playing = ref(false)
const duration = ref(0)
const currentTime = ref(0)
let audio = null
const continuousPlay = ref(false)
const isLooping = ref(false)

// 상태가 바뀔 때 처리 로직
watch(isLooping, (newVal) => {
  if (newVal) {
    console.log('연속 재생 켜짐')
    continuousPlay.value = true;
  } else {
    console.log('연속 재생 꺼짐')
    continuousPlay.value = false;
  }
})

const API_BASE = 'https://xeno-canto.org/api/3/recordings'
// 실제 API 키가 필요하면 아래처럼 사용
const API_KEY = import.meta.env.VITE_XENOCANTO_KEY

// 검색하여 상위 5개 결과 가져오기
async function fetchRecordings() {
  error.value = null
  loading.value = true
  recordings.value = []
  currentIndex.value = -1
  currentRec.value = null
  audioSrc.value = ''
  playing.value = false
  duration.value = 0
  currentTime.value = 0
  const per_page = 20
  const page = 1

  console.time("search time");
  try {
    const q = encodeURIComponent(query.value.trim())
    // en:"q" 형식 쿼리를 사용 + key 파라미터
    //const url = `${API_BASE}?query=sp:"${q}"&key=${API_KEY}` // sp:
    //const url = `${API_BASE}?query=sp:"${q}"&per_page=${per_page}&page=${page}&key=${API_KEY}`
    //const url = `${API_BASE}?query=en:"${q}"&key=${API_KEY}` // en:
    //const url = `${API_BASE}?query=en:"${q}"&per_page=${per_page}&page=${page}&key=${API_KEY}`
    // 영명검색, quality A, 길이 300초 이하
    const url = `${API_BASE}?query=en:"${q}"+q:A+len:"<60"&per_page=${per_page}&page=${page}&key=${API_KEY}`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
    if (!res.ok) {
      throw new Error(`API 요청 실패: ${res.status}`)
    }
    const json = await res.json()
    if (!json.recordings || json.recordings.length === 0) {
      error.value = '녹음이 없습니다.'
      return
    }
    // 녹음 목록 표기 갯수
    recordings.value = json.recordings.slice(0, 20)
  } catch (e) {
    console.error(e)
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
  console.timeEnd("search time");
}

// 녹음 선택 / 재생 토글
function selectRecording(idx) {
  const rec = recordings.value[idx]
  if (!rec) return

  // 만약 이미 같은 항목이 선택되어 있고 재생 중이면 일시정지
  if (currentIndex.value === idx && playing.value) {
    audio.pause()
    playing.value = false
    return
  }

  // 새 녹음 선택
  currentIndex.value = idx
  currentRec.value = rec
  // 오디오 URL 필드명은 응답 구조에 따라 조정
  audioSrc.value = rec.file || rec.audio || rec.audio_url || ''

  // 재생 전에 오디오를 bind
  attachAudio().then(() => {
    // 자동 재생
    audio.play()
      .then(() => {
        playing.value = true
      })
      .catch(err => {
        error.value = '재생 실패: ' + err.message
      })
  })
}

// 오디오 요소 연결
async function attachAudio() {
  await nextTick()
  if (!audioEl.value) return
  audio = audioEl.value
  audio.addEventListener('loadedmetadata', () => {
    duration.value = isFinite(audio.duration) ? audio.duration : 0
  })
}

// 타임 업데이트
function onTimeUpdate() {
  if (!audio) return
  currentTime.value = audio.currentTime
}

// 시크
function seek() {
  if (!audio) return
  audio.currentTime = currentTime.value
}

// 종료 이벤트
function onEnded() {
    playing.value = false
    if (continuousPlay.value) {
        const nextIndex = currentIndex.value + 1
        if (nextIndex < recordings.value.length) {
            selectRecording(nextIndex)
        }
    }
}

// 시간 포맷
function formatTime(sec) {
  if (!isFinite(sec) || sec === 0) return '0:00'
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

onBeforeUnmount(() => {
  if (audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }
})
</script>

<style scoped>
.xc-player {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.recording-list {
  margin-top: 1rem;
}
.recording-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.controls button {
  padding: 0.3rem 0.6rem;
}
.player-controls {
  margin-top: 1.5rem;
}
.error {
  color: red;
  margin-top: 0.5rem;
}
.toggle-switch {
  appearance: none;
  width: 40px;
  height: 20px;
  background: #ccc;
  border-radius: 9999px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}
.toggle-switch:checked {
  background: #4ade80; /* 초록색 */
}
.toggle-switch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}
.toggle-switch:checked::before {
  transform: translateX(20px);
}
</style>
