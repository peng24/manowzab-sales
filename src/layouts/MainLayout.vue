<template>
  <div class="flex h-screen bg-gray-50 font-sans">
    
    <!-- ========================================== -->
    <!-- SIDEBAR (DESKTOP ONLY > 768px)         -->
    <!-- ========================================== -->
    <aside class="hidden w-64 flex-col bg-slate-900 text-white md:flex transition-all duration-300">
      <!-- App Logo/Name -->
      <div class="flex h-16 items-center justify-center border-b border-slate-800 bg-slate-900">
        <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          ManowZab Sales
        </h1>
      </div>

      <!-- Desktop Navigation Links -->
      <nav class="flex-1 space-y-2 px-4 py-6">
        <router-link to="/" 
          class="flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white"
          active-class="bg-blue-600 text-white shadow-md"
        >
          <component :is="LayoutDashboard" class="mr-3 h-5 w-5" />
          Dashboard
        </router-link>

        <router-link to="/transfer" 
          class="flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white"
          active-class="bg-blue-600 text-white shadow-md"
        >
          <component :is="CreditCard" class="mr-3 h-5 w-5" />
          บันทึกยอดโอน
        </router-link>

        <router-link to="/import-cod" 
          class="flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white"
          active-class="bg-blue-600 text-white shadow-md"
        >
          <component :is="FileSpreadsheet" class="mr-3 h-5 w-5" />
          นำเข้า COD
        </router-link>

        <router-link to="/customers" 
          class="flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white"
          active-class="bg-blue-600 text-white shadow-md"
        >
          <component :is="Users" class="mr-3 h-5 w-5" />
          ข้อมูลลูกค้า
        </router-link>
      </nav>

      <!-- Logout (Desktop) -->
      <div class="border-t border-slate-800 p-4">
        <button @click="handleLogout" class="flex w-full items-center justify-center rounded-lg bg-red-500/10 py-2 text-sm font-medium text-red-400 hover:bg-red-500 hover:text-white transition-all">
          <component :is="LogOut" class="mr-2 h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- ========================================== -->
    <!-- MAIN CONTENT AREA                          -->
    <!-- ========================================== -->
    <div class="flex flex-1 flex-col h-full overflow-hidden relative">
      
      <!-- Header -->
      <header class="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6 z-10">
        <div class="flex items-center">
          <!-- Mobile Logo (Visible only on small screens) -->
          <span class="md:hidden text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mr-2">
            ManowZab
          </span>
          <!-- Desktop Title (Visible only on large screens) -->
          <h2 class="hidden text-xl font-bold text-gray-800 md:block">
            ยอดขายร้านมะนาวแซ่บ 🍋🌶️
          </h2>
        </div>

        <!-- Right Side: Date / Profile / Logout (Mobile) -->
        <div class="flex items-center gap-3">
          <span class="hidden text-sm text-gray-500 md:block">
            {{ new Date().toLocaleDateString('th-TH', { dateStyle: 'long' }) }}
          </span>
          <button @click="handleLogout" class="md:hidden rounded-full p-2 text-gray-500 hover:bg-gray-100">
             <component :is="LogOut" class="h-5 w-5" />
          </button>
        </div>
      </header>

      <!-- Scrollable Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6 pb-24 md:pb-6">
        <router-view />
      </main>

    </div>

    <!-- ========================================== -->
    <!-- BOTTOM NAVIGATION (MOBILE ONLY < 768px)    -->
    <!-- ========================================== -->
    <nav class="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden pb-safe">
      
      <router-link to="/" class="flex flex-1 flex-col items-center justify-center py-1 text-gray-500 transition-colors" active-class="text-blue-600 font-semibold">
        <component :is="LayoutDashboard" class="h-6 w-6 mb-0.5" />
        <span class="text-[10px]">ภาพรวม</span>
      </router-link>

      <router-link to="/transfer" class="flex flex-1 flex-col items-center justify-center py-1 text-gray-500 transition-colors" active-class="text-blue-600 font-semibold">
        <component :is="CreditCard" class="h-6 w-6 mb-0.5" />
        <span class="text-[10px]">โอนเงิน</span>
      </router-link>

      <router-link to="/import-cod" class="flex flex-1 flex-col items-center justify-center py-1 text-gray-500 transition-colors" active-class="text-blue-600 font-semibold">
        <div class="relative">
             <component :is="FileSpreadsheet" class="h-6 w-6 mb-0.5" />
             <!-- Badge Example (Optional) -->
             <!-- <span class="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">!</span> -->
        </div>
        <span class="text-[10px]">นำเข้า</span>
      </router-link>

       <router-link to="/customers" class="flex flex-1 flex-col items-center justify-center py-1 text-gray-500 transition-colors" active-class="text-blue-600 font-semibold">
        <component :is="Users" class="h-6 w-6 mb-0.5" />
        <span class="text-[10px]">ลูกค้า</span>
      </router-link>

    </nav>

  </div>
</template>

<style scoped>
/* Support for iPhone safe area (Home Indicator) */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>

<script setup>
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { LayoutDashboard, CreditCard, FileSpreadsheet, Users, LogOut } from 'lucide-vue-next'

const router = useRouter()

const handleLogout = async () => {
  try {
    await signOut(auth)
    router.replace('/login')
  } catch (error) {
    console.error('Logout error:', error)
    alert('Logout failed: ' + error.message)
  }
}
</script>
