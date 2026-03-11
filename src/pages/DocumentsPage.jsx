import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

const DOCS = {
  GST: {
    label: 'GST Returns',
    color: '#c9a84c',
    icon: '🧾',
    items: [
      {
        service: 'GSTR-1',
        desc: 'Monthly/Quarterly outward supply details',
        docs: ['Sales invoices (B2B & B2C)','Credit & debit notes','Advance receipts','Export invoices with shipping bill','B2BA / amendments if any'],
      },
      {
        service: 'GSTR-3B',
        desc: 'Monthly summary return',
        docs: ['GSTR-1 data (auto-populated)','Purchase invoices (for ITC claim)','Reverse charge invoices','Import of services data','Bank statement (for reconciliation)'],
      },
      {
        service: 'GSTR-2B Reconciliation',
        desc: 'ITC reconciliation with 2B statement',
        docs: ['All purchase invoices for the month','GSTR-2B statement (auto-generated)','Inward debit & credit notes','ITC reversal details if any'],
      },
      {
        service: 'GSTR-9 Annual Return',
        desc: 'Year-end consolidated return',
        docs: ['All 12 months GSTR-1 data','All 12 months GSTR-3B data','Annual purchase register','ITC reconciliation workings','Audited financials (if applicable)'],
      },
    ],
  },
  IT: {
    label: 'Income Tax',
    color: '#6fa9e8',
    icon: '📋',
    items: [
      {
        service: 'ITR Filing',
        desc: 'Income tax return — annual filing',
        docs: ['Form 16 / 16A (from employer/deductor)','Bank statements for all accounts','Investment proof (80C, 80D, HRA etc.)','Capital gains statements','P&L and Balance Sheet (if business)','Foreign income details (if applicable)','Previous year ITR copy'],
      },
      {
        service: 'Advance Tax',
        desc: 'Quarterly advance tax payment',
        docs: ['Estimated income projections','Previous year tax liability','Business income estimates','Capital gain estimates','TDS certificates received so far'],
      },
      {
        service: 'Tax Audit (44AB)',
        desc: 'Audit report for businesses above threshold',
        docs: ['Audited P&L and Balance Sheet','All bank statements','Fixed asset register','Loan repayment schedules','Stock statement','Debtors & creditors ledger'],
      },
    ],
  },
  TDS: {
    label: 'TDS Returns',
    color: '#4ecca3',
    icon: '📄',
    items: [
      {
        service: 'Form 26Q (Non-Salary TDS)',
        desc: 'TDS on contracts, rent, professional fees, etc.',
        docs: ['Vendor payment details (name, PAN, amount)','Nature of payment (section-wise)','Challan details for TDS deposited','TAN of deductor'],
      },
      {
        service: 'Form 24Q (Salary TDS)',
        desc: 'TDS on employee salaries',
        docs: ['Salary register for the quarter','Employee PAN details','Investment declarations (Form 12BB)','Challans for TDS deposited','Other income declared by employees'],
      },
      {
        service: 'Form 27Q (NRI TDS)',
        desc: 'TDS on payments to non-residents',
        docs: ['Payment details to NRI/foreign entity','Nature and section of payment','DTAA benefit details (if applicable)','Foreign remittance details (15CA/15CB)'],
      },
      {
        service: 'Form 27EQ (TCS)',
        desc: 'Tax collected at source',
        docs: ['Buyer/collectee PAN details','Transaction-wise collection details','Section-wise TCS amounts','Challan details for TCS deposited'],
      },
    ],
  },
};

function DocSection({ category, data }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="fade-up card" style={{ marginBottom: '1.1rem', padding: '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1rem', paddingBottom: '.85rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize: '1.3rem' }}>{data.icon}</span>
        <div>
          <div style={{ fontSize: '1rem', color: data.color, fontWeight: 600 }}>{data.label}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--slate)', marginTop: '.08rem' }}>Documents required for each filing type</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
        {data.items.map(item => (
          <div key={item.service} style={{ background: 'var(--navy-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,.05)' }}>
            <button
              onClick={() => setExpanded(expanded === item.service ? null : item.service)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
              <div>
                <div style={{ fontSize: '.88rem', color: 'var(--cream)', fontWeight: 600 }}>{item.service}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--slate)', marginTop: '.1rem' }}>{item.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: 99, background: `${data.color}15`, color: data.color, border: `1px solid ${data.color}33`, whiteSpace: 'nowrap' }}>
                  {item.docs.length} docs
                </span>
                {expanded === item.service ? <ChevronUp size={15} color="var(--slate)" /> : <ChevronDown size={15} color="var(--slate)" />}
              </div>
            </button>
            {expanded === item.service && (
              <div style={{ padding: '.25rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                <ul style={{ margin: 0, padding: '0 0 0 1.1rem' }}>
                  {item.docs.map((doc, i) => (
                    <li key={i} style={{ fontSize: '.82rem', color: 'var(--slate-light)', padding: '.3rem 0', borderBottom: i < item.docs.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <div>
      <div className="fade-up" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 40, height: 40, background: 'var(--navy-light)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={20} color="var(--gold)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--cream)' }}>Document Checklist</h1>
          <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.1rem' }}>What to submit for each type of compliance filing</p>
        </div>
      </div>
      <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 'var(--radius-md)', padding: '.75rem 1rem', marginBottom: '1.25rem', fontSize: '.82rem', color: 'var(--slate-light)' }}>
        💡 Share these documents with your CA before the due date to avoid delays. For any queries, use the contact info in your Assigned To column.
      </div>
      {Object.entries(DOCS).map(([key, data]) => <DocSection key={key} category={key} data={data} />)}
    </div>
  );
}
