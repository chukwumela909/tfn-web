import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

export async function POST(request: NextRequest) {
  try {
    const { email, password, channel_name } = await request.json();

    if (!email || !password || !channel_name) {
      return NextResponse.json(
        { message: 'Email, password, and channel name are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      channelName: channel_name.trim(),
    });

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Error registering user', error: {} },
      { status: 500 }
    );
  }
}
