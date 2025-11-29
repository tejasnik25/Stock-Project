import { NextRequest, NextResponse } from 'next/server';
import { createStrategy, updateStrategy } from '@/db/dbService';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // Extract basic fields
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const details = formData.get('details') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const contentType = formData.get('contentType') as string;
        const enabled = formData.get('enabled') === 'true';

        // Extract metrics
        const minCapital = formData.get('minCapital') ? Number(formData.get('minCapital')) : undefined;
        const avgDrawdown = formData.get('avgDrawdown') ? Number(formData.get('avgDrawdown')) : undefined;
        const riskReward = formData.get('riskReward') ? Number(formData.get('riskReward')) : undefined;
        const winStreak = formData.get('winStreak') ? Number(formData.get('winStreak')) : undefined;
        const tag = formData.get('tag') as string;
        const price = formData.get('price') ? Number(formData.get('price')) : 0;

        // Handle file upload
        const file = formData.get('file') as File | null;
        const icon = formData.get('icon') as File | null;

        let contentUrl = formData.get('contentUrl') as string || '';
        let finalImageUrl = imageUrl;

        // Save uploaded files
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create uploads directory if it doesn't exist
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'strategies');
            await mkdir(uploadsDir, { recursive: true });

            const fileName = `${Date.now()}-${file.name}`;
            const filePath = path.join(uploadsDir, fileName);
            await writeFile(filePath, buffer);

            contentUrl = `/uploads/strategies/${fileName}`;
        }

        if (icon) {
            const bytes = await icon.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'icons');
            await mkdir(uploadsDir, { recursive: true });

            const fileName = `${Date.now()}-${icon.name}`;
            const filePath = path.join(uploadsDir, fileName);
            await writeFile(filePath, buffer);

            finalImageUrl = `/uploads/icons/${fileName}`;
        }

        // Build parameters object from remaining form data
        const parameters: Record<string, string> = {};
        formData.forEach((value, key) => {
            if (key.startsWith('param_')) {
                const paramKey = key.replace('param_', '');
                parameters[paramKey] = value as string;
            }
        });

        const strategyData = {
            name,
            description,
            details,
            imageUrl: finalImageUrl,
            contentType: contentType as 'html' | 'pdf' | 'text',
            contentUrl,
            enabled,
            minCapital,
            avgDrawdown,
            riskReward,
            winStreak,
            tag,
            price,
            parameters: Object.keys(parameters).length > 0 ? parameters : { 'Default': 'N/A' },
            performance: 0,
            riskLevel: 'Medium' as const,
            category: 'Momentum' as const
        };

        const result = await createStrategy(strategyData);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, strategy: result.strategy });
    } catch (error) {
        console.error('Error creating strategy:', error);
        return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Strategy ID is required' }, { status: 400 });
        }

        const formData = await req.formData();

        // Extract basic fields
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const details = formData.get('details') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const contentType = formData.get('contentType') as string;
        const enabled = formData.get('enabled') === 'true';

        // Extract metrics
        const minCapital = formData.get('minCapital') ? Number(formData.get('minCapital')) : undefined;
        const avgDrawdown = formData.get('avgDrawdown') ? Number(formData.get('avgDrawdown')) : undefined;
        const riskReward = formData.get('riskReward') ? Number(formData.get('riskReward')) : undefined;
        const winStreak = formData.get('winStreak') ? Number(formData.get('winStreak')) : undefined;
        const tag = formData.get('tag') as string;
        const price = formData.get('price') ? Number(formData.get('price')) : 0;

        // Handle file upload
        const file = formData.get('file') as File | null;
        const icon = formData.get('icon') as File | null;

        let contentUrl = formData.get('contentUrl') as string || '';
        let finalImageUrl = imageUrl;

        // Save uploaded files
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'strategies');
            await mkdir(uploadsDir, { recursive: true });

            const fileName = `${Date.now()}-${file.name}`;
            const filePath = path.join(uploadsDir, fileName);
            await writeFile(filePath, buffer);

            contentUrl = `/uploads/strategies/${fileName}`;
        }

        if (icon) {
            const bytes = await icon.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'icons');
            await mkdir(uploadsDir, { recursive: true });

            const fileName = `${Date.now()}-${icon.name}`;
            const filePath = path.join(uploadsDir, fileName);
            await writeFile(filePath, buffer);

            finalImageUrl = `/uploads/icons/${fileName}`;
        }

        // Build parameters object from remaining form data
        const parameters: Record<string, string> = {};
        formData.forEach((value, key) => {
            if (key.startsWith('param_')) {
                const paramKey = key.replace('param_', '');
                parameters[paramKey] = value as string;
            }
        });

        const updateData: any = {
            name,
            description,
            details,
            imageUrl: finalImageUrl,
            contentType: contentType as 'html' | 'pdf' | 'text',
            enabled,
            minCapital,
            avgDrawdown,
            riskReward,
            winStreak,
            tag,
            price
        };

        if (contentUrl) {
            updateData.contentUrl = contentUrl;
        }

        if (Object.keys(parameters).length > 0) {
            updateData.parameters = parameters;
        }

        const result = await updateStrategy(id, updateData);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, strategy: result.strategy });
    } catch (error) {
        console.error('Error updating strategy:', error);
        return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 });
    }
}
