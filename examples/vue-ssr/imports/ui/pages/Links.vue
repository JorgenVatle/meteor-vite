<script setup lang="ts">
import { LinksCollection } from '/imports/api/links'
import VueMeteor from '/imports/ui/lib/VueMeteor';

VueMeteor.subscribe('links');
const links = VueMeteor.computed(() => LinksCollection.find());
</script>

<template>
  <h2 class="text-xl my-6 font-semibold">Learn Meteor!</h2>
  <ul class="list-disc underline">
    <li v-for="link of links" :key="link._id" class="hover:text-green-700">
      <a :href="link.url" target="_blank">{{ link.title }}</a>
    </li>
  </ul>
</template>
