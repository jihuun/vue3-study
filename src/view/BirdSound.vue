<template>
    <div class="xc-player" v-if="isLogin">

        <div id="search-container" class="search-container">
            <div class="sound-row">
                <span class="label-text"><label>새이름 검색(영명):</label></span>
                <label class="checkbox-label">
                    Call
                    <input type="checkbox" v-model="callChecked" />
                </label>
                <label class="checkbox-label">
                    Song
                    <input type="checkbox" v-model="songChecked" />
                </label>
            </div>

            <input v-model="query" class="search-input" @focus="showHistory = true" @click="showHistory = true"
                @keyup.enter="fetchRecordings" placeholder="예: March tit" />
            <transition name="fade">
                <div v-if="showHistory && searchHistory.length > 0" class="history-dropdown">
                    <ul>
                        <li v-for="(item, idx) in searchHistory" :key="idx" @click="handleHistoryClick(item)"
                            class="history-item">
                            <span class="query-text">{{ item.query }}</span>
                            <span class="time-text"> {{ formatDateTime(item.created_at) }} </span>
                        </li>
                    </ul>
                </div>
            </transition>
            <div>
                <button @click="fetchRecordings" class="search-button">Search</button>
            </div>
        </div>
        <div class="flex items-center space-x-2">
            <label for="loop-toggle" class="text-sm font-medium">연속 재생</label>
            <input id="loop-toggle" type="checkbox" v-model="isLooping" class="toggle-switch" />
        </div>
        <div v-if="loading">로딩 중...</div>
        <div v-if="error" class="error">에러: {{ error }}</div>

        <div v-if="currentRec" class="player-controls" style="width: 100%;">
            <div>
                <img :src="`https:${currentRec.sono.med}`" alt="Sonogram" class="w-full max-w-md my-2 cursor-pointer" />
            </div>

            <audio ref="audioEl" :src="audioSrc" preload="auto" @timeupdate="onTimeUpdate" @ended="onEnded"
                controls></audio>
        </div>

        <div v-if="recordings.length > 0" class="recording-list">
            <div v-for="(rec, idx) in recordings" :key="rec.id || idx" class="recording-item">
                <div class="info">
                    <strong>{{ idx + 1 }}.</strong>
                    {{ rec.en || (rec.gen + ' ' + rec.sp) }} ({{ rec.type }})
                    — {{ rec.cnt }} / {{ rec.date }} / by {{ rec.rec }} /
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
import { ref, onMounted, reactive, nextTick, onBeforeUnmount, watch } from 'vue'
import supabase from '../supabase';
import { useRouter } from 'vue-router';
import { addSearchHistory, getSearchHistory } from '../services/searchHistory.js';
const router = useRouter();

const query = ref('Marsh tit')
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

const isLogin = ref(false);

const searchHistory= ref([])
const showHistory = ref(false)

onMounted(async () => {
    const { data: {user} } = await supabase.auth.getUser();

    if (user) {
        isLogin.value = true;
        console.log('User is logged in:');
        console.log(user.email);
        searchHistory.value = await getSearchHistory();
        document.addEventListener('click', handleClickOutside)

    } else {
        isLogin.value = false;
        console.log('No user logged in');
        alert('로그인이 필요합니다.');
        router.push('/');  /* 로그인 페이지로 이동 */
    }
});

onBeforeUnmount(() => {
  if (audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }
  document.removeEventListener('click', handleClickOutside)

})

async function handleSearch(searchQuery) {
  if (!searchQuery.value.trim()) return
  await addSearchHistory(searchQuery.value.trim())
  searchHistory.value = await getSearchHistory()
}

// 외부 클릭 시 dropdown 닫기
function handleClickOutside(e) {
  const searchBox = document.getElementById('search-container')
  if (searchBox && !searchBox.contains(e.target)) {
    showHistory.value = false
  }
}

// 히스토리 클릭 시
function handleHistoryClick(item) {
  query.value = item.query
  showHistory.value = false
}

const callChecked = ref(true)
const songChecked = ref(true)
const soundType = ref('')

watch([callChecked, songChecked], ([call, song]) => {
  if (call && !song) {
    soundType.value = 'call'
  } else if (!call && song) {
    soundType.value = 'song'
  } else {
    soundType.value = ''
  }
})

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
  const resut_count = 25

  console.time("search time");
  showHistory.value = false // 검색 시 히스토리 닫기
  try {
    const query_enc = encodeURIComponent(query.value.trim())
    // en:"q" 형식 쿼리를 사용 + key 파라미터
    //const url = `${API_BASE}?query=sp:"${q}"&key=${API_KEY}` // sp:
    //const url = `${API_BASE}?query=sp:"${q}"&per_page=${per_page}&page=${page}&key=${API_KEY}`
    //const url = `${API_BASE}?query=en:"${q}"&key=${API_KEY}` // en:
    //const url = `${API_BASE}?query=en:"${q}"&per_page=${per_page}&page=${page}&key=${API_KEY}`
    // 영명검색, quality A, 길이 300초 이하
    //const url = `${API_BASE}?query=en:"${query_enc}"+q:A+len:"<300"&per_page=${per_page}&page=${page}&key=${API_KEY}`
      const tagOptions = [
        `en:"${query_enc}"`,
        `q:">C"`,
        `len:"<300"`,
        `type:"${soundType.value}"`,
      ].join("+");

      const queryParams = [
          `query=${tagOptions}`,
          `per_page=${per_page}`,
          `page=${page}`,
          `key=${API_KEY}`,
      ].join("&");
      const url = `${API_BASE}?${queryParams}`;

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
    recordings.value = json.recordings.slice(0, resut_count)

    // 검색어 기록에 추가
    await handleSearch(query);


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
  audioSrc.value = rec.file || ''

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

// history 날짜 포맷
function formatDateTime(input) {
  if (!input) return ''
  const d = new Date(input)
  if (isNaN(d)) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${min}`
}
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

.sound-row {
  display: flex;
  align-items: center;   /* 세로 가운데 정렬 */
  justify-content: flex-start; /* 왼쪽 정렬 */
  white-space: nowrap;   /* 줄바꿈 방지 */
  gap: 30px;             /* 항목 사이 간격 */
}

.label-text {
  font-weight: 500;
  margin-right: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;              /* Call / Song 과 체크박스 간의 거리 */
  cursor: pointer;
}

/* 기본 레이아웃 */
.search-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 40px auto;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 14px;
  border: 1px solid #ccc;
  border-radius: 999px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #0078ff;
}


/* 히스토리 드롭다운 */
.history-dropdown {
  position: absolute;
  /*top: 45px;*/
  top: 80%; /* FIXME */
  width: 100%;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
  animation: fadeIn 0.15s ease;
}

.history-item {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.history-item:hover {
  background-color: #f5f5f5;
}

.query-text {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-text {
  font-size: 12px;
  color: #999;
  margin-left: 10px;
}

/* fade 효과 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
