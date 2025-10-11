<script setup>
    import { ref } from 'vue'
    const email = ref('');
    const password = ref('');

    const handleLogin = () => {
        console.log('Email:', email.value);
        console.log('Password:', password.value);
    }
</script>

<template>
    <h1>Login</h1>
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
</style>