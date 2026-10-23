import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const page = await prisma.customPage.findUnique({
        where: { slug },
      });
      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      return NextResponse.json({ page });
    }

    const pages = await prisma.customPage.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching custom pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const page = await prisma.customPage.create({
      data: {
        title: body.title,
        slug,
        content: body.content || '',
        metaTitle: body.metaTitle || body.title,
        metaDesc: body.metaDesc || '',
        status: body.status || 'published',
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    console.error('Error creating custom page:', error);
    return NextResponse.json({ error: error.message || 'Failed to create page' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { id, slug, title, content, metaTitle, metaDesc, status } = body;

    const whereClause = id ? { id } : { slug };
    const page = await prisma.customPage.update({
      where: whereClause,
      data: {
        title: title !== undefined ? title : undefined,
        slug: slug !== undefined ? slug : undefined,
        content: content !== undefined ? content : undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : undefined,
        metaDesc: metaDesc !== undefined ? metaDesc : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    console.error('Error updating custom page:', error);
    return NextResponse.json({ error: error.message || 'Failed to update page' }, { status: 500 });
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
    await prisma.customPage.delete({
      where: whereClause,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting custom page:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete page' }, { status: 500 });
  }
}
