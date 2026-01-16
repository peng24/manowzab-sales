<template>
  <div class="pull-to-refresh-container" ref="containerRef">
    <!-- Pull-to-Refresh Indicator -->
    <div 
      class="refresh-indicator"
      :style="{ 
        transform: `translateY(${pullDistance}px)`,
        opacity: isRefreshing ? 1 : pullDistance / threshold
      }"
    >
      <div 
        class="refresh-icon"
        :class="{ 'animate-spin': isRefreshing }"
      >
        <svg 
          class="w-6 h-6 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-600 mt-2">
        {{ isRefreshing ? 'กำลังรีเฟรช...' : (pullDistance >= threshold ? 'ปล่อยเพื่อรีเฟรช' : 'ดึงลงเพื่อรีเฟรช') }}
      </p>
    </div>

    <!-- Content Slot -->
    <div 
      class="content-wrapper"
      :style="{ 
        transform: isPulling ? `translateY(${Math.min(pullDistance, maxPullDistance)}px)` : '',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  onRefresh: {
    type: Function,
    required: true
  }
})

// State
const containerRef = ref(null)
const isPulling = ref(false)
const isRefreshing = ref(false)
const pullDistance = ref(0)
const startY = ref(0)

// Constants
const threshold = 80 // Minimum pull distance to trigger refresh
const maxPullDistance = 120 // Maximum pull distance for visual effect

// Touch Event Handlers
const handleTouchStart = (e) => {
  // Only allow pull-to-refresh at the top of the page
  if (window.scrollY !== 0) return
  
  startY.value = e.touches[0].clientY
  isPulling.value = true
}

const handleTouchMove = (e) => {
  if (!isPulling.value || isRefreshing.value) return
  
  const currentY = e.touches[0].clientY
  const distance = currentY - startY.value
  
  // Only pull down (positive distance) and only at top of page
  if (distance > 0 && window.scrollY === 0) {
    // Prevent default scroll behavior while pulling
    e.preventDefault()
    
    // Apply resistance curve for smoother feel
    pullDistance.value = Math.min(distance * 0.5, maxPullDistance)
  }
}

const handleTouchEnd = async () => {
  if (!isPulling.value || isRefreshing.value) return
  
  isPulling.value = false
  
  // Check if pulled enough to trigger refresh
  if (pullDistance.value >= threshold) {
    isRefreshing.value = true
    
    try {
      // Call the refresh function (must be async or return Promise)
      await props.onRefresh()
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      // Reset state
      setTimeout(() => {
        isRefreshing.value = false
        pullDistance.value = 0
      }, 300)
    }
  } else {
    // Not pulled enough, reset
    pullDistance.value = 0
  }
}

// Lifecycle
onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    containerRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    containerRef.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('touchstart', handleTouchStart)
    containerRef.value.removeEventListener('touchmove', handleTouchMove)
    containerRef.value.removeEventListener('touchend', handleTouchEnd)
  }
})
</script>

<style scoped>
.pull-to-refresh-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.refresh-indicator {
  position: absolute;
  top: -80px;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.refresh-icon {
  transition: transform 0.3s ease;
}

.content-wrapper {
  position: relative;
  will-change: transform;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
