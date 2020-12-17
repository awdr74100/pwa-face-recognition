<template>
  <div id="app">
    <Spinner />
    <router-view></router-view>
  </div>
</template>

<script>
import Spinner from '@/components/Spinner.vue';

export default {
  components: {
    Spinner,
  },
};
</script>

<style lang="scss">
@import '~@/assets/scss/all.scss';
</style>
