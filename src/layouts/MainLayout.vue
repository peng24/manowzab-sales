<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-16 items-center justify-center border-b border-slate-800 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        ManowZab Sales
      </div>
      <nav class="mt-4 px-4 space-y-2">
        <router-link
          to="/"
          class="flex items-center rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors"
          active-class="bg-blue-600 text-white"
        >
          <component :is="LayoutDashboard" class="mr-3 h-5 w-5" />
          Dashboard
        </router-link>
        <router-link
          to="/transfer"
          class="flex items-center rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors"
          active-class="bg-blue-600 text-white"
        >
          <component :is="CreditCard" class="mr-3 h-5 w-5" />
          บันทึกยอดโอน
        </router-link>
        <router-link
          to="/import-cod"
          class="flex items-center rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors"
          active-class="bg-blue-600 text-white"
        >
          <component :is="FileSpreadsheet" class="mr-3 h-5 w-5" />
          นำเข้า COD
        </router-link>
        <router-link
          to="/customers"
          class="flex items-center rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors"
          active-class="bg-blue-600 text-white"
        >
          <component :is="Users" class="mr-3 h-5 w-5" />
          ข้อมูลลูกค้า
        </router-link>
      </nav>

      <div class="mt-auto px-4 pb-4">
        <button
          @click="handleLogout"
          class="flex w-full items-center rounded-lg px-4 py-2 text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
          <component :is="LogOut" class="mr-3 h-5 w-5" />
          ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="isSidebarOpen = false"
    ></div>

    <!-- Main Content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header (Desktop & Mobile) -->
      <header class="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
        <div class="flex items-center">
            <button @click="isSidebarOpen = !isSidebarOpen" class="text-gray-500 lg:hidden mr-4">
            <component :is="Menu" class="h-6 w-6" />
            </button>
            <h2 class="text-xl font-bold text-gray-800 hidden sm:block">ยอดขายร้านมะนาวแซ่บ 🍋🌶️</h2>
        </div>
        <!-- Right side (Profile or Date could go here) -->
        <div class="text-sm text-gray-500 hidden sm:block">{{ new Date().toLocaleDateString('th-TH', { dateStyle: 'long' }) }}</div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { LayoutDashboard, CreditCard, FileSpreadsheet, Menu, LogOut, Users } from 'lucide-vue-next'

const router = useRouter()
const isSidebarOpen = ref(false)

const handleLogout = async () => {
  try {
    await signOut(auth)
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    alert('Logout failed: ' + error.message)
  }
}
</script>
