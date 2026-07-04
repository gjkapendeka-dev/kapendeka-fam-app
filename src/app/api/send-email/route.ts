import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend('re_6z5xxWxh_3sjSkdjXEo6ydEE1kQVXdAVh');

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Kapendeka Hub <onboarding@resend.dev>', // Resend sandbox domain requires onboarding@resend.dev unless verified
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
