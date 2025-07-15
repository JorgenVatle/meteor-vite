<script setup lang="ts">
import { routes } from '/imports/ui/router';
</script>

<template>
  <nav class="flex items-center">
    <router-link v-for="route in routes" :to="{ name: route.name }" class="mr-4 text-green-700 hover:underline capitalize" active-class="font-bold">
      {{ route.name }}
    </router-link>
  </nav>
</template>
