import { Metadata } from 'next'
import CoursesPageClient from './CoursesPageClient'

export const metadata: Metadata = {
  title: "Kurslar",
  description: "Profesyonel şeflerden gastronomi ve aşçılık kurslarını keşfedin. Video dersler, uygulamalı projeler ve sertifika programları.",
}

export default function CoursesPage() {
  return <CoursesPageClient />
}
