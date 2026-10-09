export const financeSpecs=[
 {logical:'cr78c_projects',kind:'projects',fields:{name:'cr78c_name',reference:'cr78c_reference'}},
 {logical:'cr78c_supplier',kind:'suppliers',fields:{name:'cr78c_name',reference:'cr78c_account_number',company_number:'cr78c_company_number'}},
 {logical:'als_supplier',kind:'suppliers',fields:{name:'als_name',company_number:'als_companynumber'}},
 {logical:'cr78c_customers',kind:'customers',fields:{name:'cr78c_name',reference:'cr78c_ac',company_number:'cr78c_company_number'}},
 {logical:'cr78c_purchase_order',kind:'purchase_orders',fields:{name:'cr78c_name',reference:'cr78c_name',amount:'cr78c_total_net_value',project_source_id:'cr78c_project',supplier_source_id:'cr78c_supplier',alternate_supplier:'als_supplier',approval:'cr78c_approval_status',approved:'cr78c_approved',sent:'cr78c_sent',date:'cr78c_sent_date'}},
 {logical:'cr78c_purchase_order_line_item',kind:'line_items',fields:{name:'cr78c_name',description:'cr78c_description',amount:'cr78c_net_value',gross:'cr78c_gross_value',vat:'cr78c_vat_value',parent_id:'cr78c_po_number'}},
 {logical:'cr78c_sales_invoice',kind:'invoices',fields:{name:'cr78c_name',reference:'cr78c_invoice_number',project_source_id:'cr78c_projects',customer_source_id:'cr78c_customers',approval:'cr78c_approval_status',approved:'cr78c_approved',sent:'cr78c_sent',date:'cr78c_sent_date'}}
];
export const financeNamespace=environment=>`dataverse:${environment}`;