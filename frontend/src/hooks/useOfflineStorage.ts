import { useState, useEffect } from 'react'
import localforage from 'localforage'
import { OfflineInspection } from '@/types'

// Configure localforage
const offlineStore = localforage.createInstance({
  name: 'inspection-saas',
  storeName: 'offline_inspections',
})

export function useOfflineStorage() {
  const [offlineInspections, setOfflineInspections] = useState<OfflineInspection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOfflineInspections()
  }, [])

  const loadOfflineInspections = async () => {
    try {
      const keys = await offlineStore.keys()
      const inspections: OfflineInspection[] = []
      
      for (const key of keys) {
        const inspection = await offlineStore.getItem<OfflineInspection>(key)
        if (inspection) {
          inspections.push(inspection)
        }
      }
      
      setOfflineInspections(inspections.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    } catch (error) {
      console.error('Error loading offline inspections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveOfflineInspection = async (inspection: OfflineInspection) => {
    try {
      await offlineStore.setItem(inspection.id, inspection)
      await loadOfflineInspections()
      return true
    } catch (error) {
      console.error('Error saving offline inspection:', error)
      return false
    }
  }

  const updateOfflineInspection = async (id: string, updates: Partial<OfflineInspection>) => {
    try {
      const existing = await offlineStore.getItem<OfflineInspection>(id)
      if (existing) {
        const updated = { ...existing, ...updates }
        await offlineStore.setItem(id, updated)
        await loadOfflineInspections()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating offline inspection:', error)
      return false
    }
  }

  const deleteOfflineInspection = async (id: string) => {
    try {
      await offlineStore.removeItem(id)
      await loadOfflineInspections()
      return true
    } catch (error) {
      console.error('Error deleting offline inspection:', error)
      return false
    }
  }

  const clearAllOfflineInspections = async () => {
    try {
      await offlineStore.clear()
      setOfflineInspections([])
      return true
    } catch (error) {
      console.error('Error clearing offline inspections:', error)
      return false
    }
  }

  const getPendingCount = () => {
    return offlineInspections.filter(i => i.status === 'PENDING').length
  }

  return {
    offlineInspections,
    isLoading,
    saveOfflineInspection,
    updateOfflineInspection,
    deleteOfflineInspection,
    clearAllOfflineInspections,
    getPendingCount,
    reload: loadOfflineInspections,
  }
}
