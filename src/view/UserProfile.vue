<script setup>
import supabase from '../supabase';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const isLogin = ref(false);

onMounted(async () => {
    const { data: {user} } = await supabase.auth.getUser();

    if (user) {
        isLogin.value = true;
        console.log('User is logged in:');
        console.log(user.email);
    } else {
        isLogin.value = false;
        console.log('No user logged in');
        alert('로그인이 필요합니다.');
        router.push('/');  /* 로그인 페이지로 이동 */
    }
});
</script>

<template>
    <div class="container" v-if="isLogin">
        <h1>User Profile</h1>
    </div>
</template>

<style scoped lang="scss">
</style>