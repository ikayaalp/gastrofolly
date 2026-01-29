import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/my-courses/'],
        },
        sitemap: 'https://culinora.net/sitemap.xml',
    }
}
