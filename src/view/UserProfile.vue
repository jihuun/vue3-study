<script setup>
import supabase from '../supabase';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const isLogin = ref(false);
const userProfile = ref('');

onMounted(async () => {
    const { data: {user} } = await supabase.auth.getUser();

    if (user) {
        isLogin.value = true;
        console.log('User is logged in:');
        console.log(user.email);
        userProfile.value = user;
    } else {
        isLogin.value = false;
        console.log('No user logged in');
        alert('로그인이 필요합니다.');
        router.push('/');  /* 로그인 페이지로 이동 */
    }
});

const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
        alert('Error logging out: ' + error.message);
    } else {
        alert('Logout successful!');
        isLogin.value = false;
        router.push('/');  /* 로그인 페이지로 이동 */
    }
}
</script>

<template>
    <div class="container" v-if="isLogin">
        <h1>User Profile</h1>
        <p>{{ userProfile }}</p>
        <button class="logout" @click="handleLogout">Logout</button>
    </div>
</template>

<style scoped lang="scss">
  button {
    background: transparent;
    color: var(--main-color);
    font-size: 16px;
    margin-top: 40px;
    &:hover{
      opacity: 0.7;
      text-decoration: underline;
    }
  }
</style>