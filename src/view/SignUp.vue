<script setup>
import { ref } from 'vue';
import supabase from '../supabase.js';

import { useRouter } from 'vue-router';
const router = useRouter();

const isLoading = ref(false);
const email = ref('');
const password = ref('');
const tel = ref('');
const text = ref('');
const name = ref('');
const addr = ref('');

const handleSignup = async () => {
    isLoading.value = true;
    /* 회원가입 처리 로직 */
    const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
    })
    if (error)  {
        alert('Error signing up:' + error.message);
    } else {

        /* 추가 정보(user_table)에 저장 */
        const { err_insert } = await supabase
            .from('user_table')
            .insert({
                tel: tel.value,
                text: text.value,
                name: name.value,
                address: addr.value,
            });
        if (err_insert) {
            alert('Error inserting additional info' + err_insert.message);
        } else {
            console.log('Additional info inserted successfully');
            alert('Signup successful!');
            isLoading.value = false;
            router.push('/');  /* 로그인 페이지로 이동 */
        }
    }
}
</script>

<template>
    <div class="loading_info" v-if="isLoading">
        <p>회원가입 처리 중...</p>
    </div>

    <div class="form-container">
        <form @submit.prevent="handleSignup">
            <div class="form-group">
                <label for="email">email</label>
                <input type="email" id="email" placeholder="이메일 입력" required v-model="email" />
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" placeholder="비밀번호 입력" required v-model="password" />
            </div>
            <div class="form-group">
                <label for="tel">Phone</label>
                <input type="tel" id="tel" placeholder="010-1234-5678" required v-model="tel" />
            </div>
            <div class="form-group">
                <label for="name">Name</label>
                <input type="name" id="name" placeholder="이름 입력" required v-model="name" />
            </div>
            <div class="form-group">
                <label for="address">Address</label>
                <input type="address" id="address" placeholder="주소 입력" required v-model="addr" />
            </div>
            <div class="form-group">
                <label for="text">자기소개</label>
                <textarea id="text" v-model="text"></textarea>
            </div>
            <button type="submit">회원가입</button>
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