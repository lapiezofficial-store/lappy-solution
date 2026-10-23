import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    if (slug) {
      const blog = await prisma.blogPost.findUnique({
        where: { slug },
      });
      if (!blog) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
      }
      return NextResponse.json({ blog });
    }

    const where: any = {};
    if (category && category !== 'All') {
      where.category = category;
    }

    const blogs = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const blog = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug,
        excerpt: body.excerpt || '',
        content: body.content || '',
        coverImage: body.coverImage || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000',
        category: body.category || 'Hardware Guide',
        author: body.author || 'Lapiez Team',
        readTime: body.readTime || '4 min read',
        tags: body.tags || '',
        status: body.status || 'published',
      },
    });

    return NextResponse.json({ success: true, blog });
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: error.message || 'Failed to create blog' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { id, slug, title, excerpt, content, coverImage, category, author, readTime, tags, status } = body;

    const whereClause = id ? { id } : { slug };
    const blog = await prisma.blogPost.update({
      where: whereClause,
      data: {
        title: title !== undefined ? title : undefined,
        slug: slug !== undefined ? slug : undefined,
        excerpt: excerpt !== undefined ? excerpt : undefined,
        content: content !== undefined ? content : undefined,
        coverImage: coverImage !== undefined ? coverImage : undefined,
        category: category !== undefined ? category : undefined,
        author: author !== undefined ? author : undefined,
        readTime: readTime !== undefined ? readTime : undefined,
        tags: tags !== undefined ? tags : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    return NextResponse.json({ success: true, blog });
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: error.message || 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (!id && !slug) {
      return NextResponse.json({ error: 'Missing id or slug' }, { status: 400 });
    }

    const whereClause = id ? { id } : { slug: slug! };
    await prisma.blogPost.delete({
      where: whereClause,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete blog' }, { status: 500 });
  }
}
