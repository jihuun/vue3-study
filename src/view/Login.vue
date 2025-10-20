<script setup>
    import { onMounted, ref } from 'vue';
    import supabase from '../supabase.js';
    import { useRouter } from 'vue-router';

    const email = ref('');
    const password = ref('');
    const isLoading = ref(false);
    const router = useRouter();

    onMounted(async () => {
        const { data: {user} } = await supabase.auth.getUser();

        if (user) {
            console.log('User is logged in: ' + user.email);
            router.push('/bird-sound');  /* Main 페이지로 이동 */
        } else {
            console.log('Need to log in');
        }
    });

    const handleLogin = async () => {
        isLoading.value = true;
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.value,
            password: password.value,
        })
        if (error) {
            alert('Error logging in: ' + error.message);
        } else {
            alert('Login successful!');
            isLoading.value = false;
            router.push('/job-list');  /* 채용공고 페이지로 이동 */
        }
    }
</script>

<template>
    <div class="loading_info" v-if="isLoading">
        <p>로그인 중...</p>
    </div>

    <div class="form-container">
        <form @submit.prevent="handleLogin">
            <div class="form-group">
                <label for="email">email</label>
                <input
                    type="email"
                    id="email"
                    placeholder="이메일 입력"
                    required
                    v-model="email"
                />
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    placeholder="비밀번호 입력"
                    required
                    v-model="password"
                />
            </div>
            <button type="submit">Login</button>
            <router-link to="/signup">Sign Up</router-link>
        </form>
    </div>
</template>         

<style lang="scss">
    @import "../style/form.scss";

    .loading_info {
      position: fixed;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      display: grid;
      place-items: center;
    }
</style>