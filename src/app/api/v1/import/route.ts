import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { entityType, records, orgId } = await request.json()

    if (!entityType || !records || !orgId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['contacts', 'companies', 'deals'].includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Add organization_id to all records
    const withOrg = records.map((r: Record<string, unknown>) => ({
      ...r,
      organization_id: orgId,
    }))

    // Insert in batches
    const batchSize = 100
    let imported = 0
    let errors = 0

    for (let i = 0; i < withOrg.length; i += batchSize) {
      const batch = withOrg.slice(i, i + batchSize)
      const { error } = await supabase.from(entityType).insert(batch)

      if (error) {
        errors += batch.length
        console.error(`Import batch error (${entityType}):`, error)
      } else {
        imported += batch.length
      }
    }

    return NextResponse.json({ success: true, imported, errors })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
