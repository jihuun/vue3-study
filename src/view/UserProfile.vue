<script setup>
import supabase from '../supabase';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const isLogin = ref(false);

const name = ref('');
const addr = ref('');
const text = ref('');

onMounted(async () => {
    const { data: {user} } = await supabase.auth.getUser();

    if (user) {
        isLogin.value = true;
        console.log('User is logged in:');
        console.log(user.email);
        const { data, error } = await supabase
          .from('user_table')
          .select()
          .eq('id', user.id)

        if (data) {
          name.value = data[0].name;
          addr.value = data[0].address;
          text.value = data[0].text;
        }

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
    <div class="form-container" v-if="isLogin">
        <div class="top-info-box">
            <img src="/vite.svg" alt="profile">
            <div class="right-info">
                <span class="name">{{ name }}</span>
                <address>{{ addr }}</address>
            </div>
        </div>
        <div class="text-info">
            <h4>자기소개</h4>
            <p> {{ text }} </p>
        </div>
        <button class="logout" @click="handleLogout">Logout</button>
    </div>
</template>

<style lang="scss" scoped>
  // 버튼 디자인 수정
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

  .form-container {
    margin-top: 20px;
  }

  .top-info-box {
    display: flex;
    align-items: center;
    margin-bottom: 40px;

    img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 12px;
    }

    .right-info {
      width: 100%;
      line-height: 1.4;

      .name {
        font-size: 16px;
        font-weight: 600;
      }
      address {
        font-size: 14px;
        font-weight: 400;
        font-style: normal;
        color: #777;
      }
    }
  }

  .text-info {
    margin-bottom: 25px;
    h4 {
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      color: #333;
      line-height: 20px;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      padding: 12px 1rem;
    }
  }

</style>