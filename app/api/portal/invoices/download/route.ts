import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabaseServer'
import { generateInvoiceHTML } from '@/lib/pdf/invoice'
import { generatePDF } from '@/lib/pdf/generator'

// GET /api/portal/invoices/download?invoice_id=xxx
export async function GET(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const invoiceId = new URL(req.url).searchParams.get('invoice_id')
    if (!invoiceId) return NextResponse.json({ error: 'invoice_id required' }, { status: 400 })

    // Verify invoice belongs to this client
    const { data: pu } = await admin
      .from('portal_users')
      .select('client_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const clientId = pu?.client_id || user.app_metadata?.client_id
    if (!clientId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('client_id', clientId)
      .single()

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const { data: client } = await admin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://autonex-docs-8x12.vercel.app'
    const html = await generateInvoiceHTML(client, invoice, portalUrl)
    const pdf = await generatePDF(html)

    const safeName = client.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}-${safeName}.pdf"`,
        'Content-Length': pdf.length.toString(),
      },
    })
  } catch (err: any) {
    console.error('[portal/invoices/download]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
