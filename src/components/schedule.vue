<template>
    <div v-if="loading" class="main-box">
        {{percent}} %
    </div>
</template>
<script lang="ts" setup>
    import { computed } from 'vue';
    const props = withDefaults(defineProps<{
        start?: number
        end?: number
        loading?: boolean
        }>(), {
        loading: false,
        start: 1,
        end: 100,
    })
    // 定义 percent 计算属性
    const percent = computed(() => {
        // 防止除以零的情况
        if (props.end === 0) return 0;
        else if(props.end <= props.start) return 100
        else return Math.floor((props.start / props.end) * 100); // 计算百分比并取整（不保留小数）
    });
</script>
<style lang="scss" scoped>
.main-box {
    position: fixed;
    left: 50%;
    top: 56%;
    z-index: 101;
    color: #d14424;
}
</style>