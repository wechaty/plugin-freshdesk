/* eslint-disable camelcase */
export enum Source {
  Email          = 1,
  Portal         = 2,
  Phone          = 3,
  Chat           = 7,
  Mobihelp       = 8,
  FeedbackWidget = 9,
  OutboundEmail  = 10,
}

export enum Status {
  Open     = 2,
  Pending  = 3,
  Resolved = 4,
  Closed   = 5,
}

export enum Priority {
  Low    = 1,
  Medium = 2,
  High   = 3,
  Urgent = 4,
}

export interface TicketPayload {
  id?                 : number    // id?
  name?               : string    // Name of the requester
  requester_id?       : number    // User ID of the requester. For existing contacts, the requester_id can be passed instead of the requester's email.
  email?              : string    // Email address of the requester. If no contact exists with this email address in Freshdesk, it will be added as a new contact.
  facebook_id?        : string    // Facebook ID of the requester. A contact should exist with this facebook_id in Freshdesk.
  phone?              : string    // Phone number of the requester. If no contact exists with this phone number in Freshdesk, it will be added as a new contact. If the phone number is set and the email address is not, then the name attribute is mandatory.
  twitter_id?         : string    // Twitter handle of the requester. If no contact exists with this handle in Freshdesk, it will be added as a new contact.
  unique_external_id? : string    // External ID of the requester. If no contact exists with this external ID in Freshdesk, they will be added as a new contact.
  subject             : string    // Subject of the ticket. The default Value is null.
  type?               : string    // Helps categorize the ticket according to the different kinds of issues your support team deals with. The default Value is null.
  status?             : Status    // Status of the ticket. The default Value is 2.
  priority?           : Priority  // Priority of the ticket. The default value is 1.
  description         : string    // HTML content of the ticket.
  responder_id?       : number    // ID of the agent to whom the ticket has been assigned
  attachments?        : any[]     // of objects Ticket attachments. The total size of these attachments cannot exceed 15MB.
  cc_emails?          : string[]  // of strings Email address added in the 'cc' field of the incoming ticket email
  custom_fields?      : object    // Key value pairs containing the names and values of custom fields. Read more here
  due_by?             : string    // Timestamp that denotes when the ticket is due to be resolved
  email_config_id?    : number    // ID of email config which is used for this ticket. (i.e., support@yourcompany.com/sales@yourcompany.com) If product_id is given and email_config_id is not given, product's primary email_config_id will be set
  fr_due_by?          : string    // Timestamp that denotes when the first response is due
  group_id?           : number    // ID of the group to which the ticket has been assigned. The default value is the ID of the group that is associated with the given email_config_id
  product_id?         : number    // ID of the product to which the ticket is associated. It will be ignored if the email_config_id attribute is set in the request.
  source?             : Source    // The channel through which the ticket was created. The default value is 2.
  tags?               : string[]  // of strings Tags that have been associated with the ticket
  company_id?         : number    // Company ID of the requester. This attribute can only be set if the Multiple Companies feature is enabled (Estate plan and above)
}

export interface ContactPayload {
  active             : boolean   // Set to true if the contact has been verified
  address            : string    // Address of the contact
  avatar             : object    // Avatar of the contact
  company_id         : number    // ID of the primary company to which this contact belongs
  view_all_tickets   : boolean   // Set to true if the contact can see all tickets that are associated with the company to which he belong
  custom_fields      : object    // Key value pair containing the name and value of the custom fields. Read more here
  deleted            : boolean   // Set to true if the contact has been deleted. Note that this attribute will only be present for deleted contacts
  description        : string    // A short description of the contact
  email              : string    // Primary email address of the contact. If you want to associate additional email(s) with this contact, use the other_emails attribute
  id                 : number    // ID of the contact
  job_title          : string    // Job title of the contact
  language           : string    // Language of the contact
  mobile             : number    // Mobile number of the contact
  name               : string    // Name of the contact
  other_emails       : string[]  // of strings Additional emails associated with the contact
  phone              : string    // Telephone number of the contact
  tags               : string[]  // of strings Tags associated with this contact
  time_zone          : string    // Time zone in which the contact resides
  twitter_id         : string    // Twitter handle of the contact
  unique_external_id : string    // External ID of the contact
  other_companies    : any[]     // of hashes Additional companies associated with the contact
  created_at         : string    // Contact creation timestamp
  updated_at         : string    // Contact updated timestamp
}
