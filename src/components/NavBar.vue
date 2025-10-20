<script setup>
    import { Icon } from '@iconify/vue';
    import { useRoute } from 'vue-router';
    import { watch, ref } from 'vue';

    let route = useRoute();
    let currentPath = route.path;
    let title = ref('');

    watch(route, (newPath) => {
        currentPath = newPath.path;
        console.log(currentPath);

        switch (currentPath) {
            case '/':
                title.value = '로그인';
                break;
            case '/signup':
                title.value = '회원가입';
                break;
            case '/job-list':
                title.value = '채용공고';
                break;
            case '/job-detail':
                title.value = '채용공고 상세';
                break;
            case '/job-post':
                title.value = '채용공고 등록';
                break;
            case '/user-profile':
                title.value = '프로필';
                break;
            case '/bird-sound':
                title.value = 'Bird Sound Player';
                break;
            default:
                title = '';
        }
    });
</script>

<template>
    <nav>
        <h1>{{ title }}</h1>
        <!-- x 닫기 버튼 -->
        <router-link v-if="currentPath === '/'
                || currentPath === '/signup'
                || currentPath === '/job-post'" to="/job-list" class="btn-close">
            <Icon icon="material-symbols:close" width="24" height="24" style="color: #1e1e1e" />
        </router-link>

        <!-- 뒤로가기 버튼 -->
        <router-link v-if="currentPath === '/job-detail' ||
            currentPath === '/user-profile' ||
            currentPath === '/bird-sound'" to="/job-list"
            class="btn-close">
            <Icon icon="ic:baseline-arrow-back" width="24" height="24" style="color: 1e1e1e" />
        </router-link>

        <div class="right-icons" v-if="currentPath === '/bird-sound'">
            <router-link to="/bird-sound">
                <Icon icon="ph:bird-bold" width="24" height="24" />
            </router-link>
            <router-link to="/user-profile">
                <Icon icon="teenyicons:user-circle-solid" width="24" height="24" style="color: 1e1e1e" />
            </router-link>
        </div>

        <!-- job-list 우측에 배치되는 프로필, 글쓰기 아이콘 -->
        <div class="right-icons" v-if="currentPath === '/job-list'">
            <router-link to="/bird-sound">
                <Icon icon="ph:bird-bold" width="24" height="24" />
            </router-link>
            <router-link to="/user-profile">
                <Icon icon="teenyicons:user-circle-solid" width="24" height="24" style="color: 1e1e1e" />
            </router-link>
            <router-link to="/job-post">
                <Icon icon="mdi:pencil-outline" width="24" height="24" style="color: 1e1e1e" />
            </router-link>
        </div>
    </nav>
</template>

<style lang="scss" scoped>
  nav {
    position: relative;
    background: pink;
    border-bottom: 1px solid #ccc;
    width: 100%;
    height: 44px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    h1 {
      font-size: 16px;
      color: var(--text-color-dark);
    }
    .btn-close {
      position: absolute;
      left: 15px;
      text-decoration: none;
    }
  }

  .right-icons {
    position: absolute;
    right: 15px;
    top: 10px;
    display: flex;
    gap: 10px;
  }
</style>