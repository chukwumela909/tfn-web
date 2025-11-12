// POST /api/admin/comments/generate
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommentQueue from '@/models/commentQueue';
import mongoose from 'mongoose';

// Nigerian names for usernames
const nigerianNames = [
  'Chinedu', 'Ngozi Okafor', 'Oluwaseun', 'Adaeze Nwankwo', 'Emeka', 'Chioma Eze', 'Tunde', 'Blessing',
  'Ibrahim Yusuf', 'Fatima', 'Chiamaka', 'Chukwudi Okeke', 'Adeola', 'Funke Adeyemi', 'Segun', 'Bisi',
  'Uche', 'Amaka Obi', 'Kazeem', 'Aminat', 'Obinna Chukwu', 'Ifeoma', 'Yusuf', 'Hauwa Mohammed',
  'Ifeanyi', 'Nkechi Ogbu', 'Babatunde', 'Kemi', 'Chidi Ike', 'Nneka', 'Musa', 'Zainab Hassan',
  'Ikechukwu Nnamdi', 'Chinenye', 'Oluwatoyin', 'Titilayo Bello', 'Chukwuemeka', 'Obiageli',
  'Mark Johnson', 'Sarah', 'David Chen', 'Grace', 'John Williams', 'Mary', 'Peter', 'Ruth Kamau', 'Paul Rodriguez', 'Esther',
  'Michael', 'Jennifer Brown', 'James', 'Linda Okoro', 'Daniel', 'Patricia Garcia', 'Joseph', 'Elizabeth Mensah'
];

const stylePrompts = {
  praise: `Generate enthusiastic praise and worship comments for a Christian livestream. Include emojis like 🙌, 🔥, 🙏. Examples:
- "Hallelujah! Glory to God! 🙌"
- "Jesus is Lord! "
- "Glory to the Most High God! "`,
  
  testimonial: `Generate faith-based testimonial comments for a Christian livestream. Include emojis like 🙏, ✨, 💫. Examples:
- "I receive my healing tonight! "
- "My breakthrough is here in Jesus name! "
- "Thank you Lord for answered prayers! "`,
  
  prayer: `Generate prayer request comments for a Christian livestream. Include emojis like 🙏, 😭. Examples:
- "Lord bless my family 🙏"
- "Prayer request: God help me overcome 🙏😭"
- "Father heal my mother 🙏"`,
  
  interactive: `Generate interactive location-based comments for a Christian livestream. Include country flags and emojis. Examples:
- "Amen! Watching from Lagos! 🇳🇬"
- "Watching from Nairobi 🇰🇪, Glory to God!"
- "Abuja in the house! Hallelujah! "`,
  
  custom: `Generate authentic comments for a Christian livestream based on the custom theme provided. Use proper english, only use pidgin english when stated, no emoji's except i explicitly stated in the custom prompt. don't mention Dr Daysman or David Hernandez unless stated in the custom prompt.`
};

export async function POST(req: NextRequest) {
  try {
    const { styles, batchSize, customPrompt, streamId } = await req.json();

    if (!styles || !Array.isArray(styles) || styles.length === 0) {
      return NextResponse.json(
        { error: 'At least one style must be selected' },
        { status: 400 }
      );
    }

    if (!batchSize || batchSize < 5 || batchSize > 20) {
      return NextResponse.json(
        { error: 'Batch size must be between 5 and 20' },
        { status: 400 }
      );
    }

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Build the AI prompt
    let styleInstructions = '';
    
    // If only 'custom' style is selected, rely entirely on custom prompt
    if (styles.includes('custom') && styles.length === 1 && customPrompt) {
      styleInstructions = `Generate comments based on this theme: ${customPrompt}`;
    } else {
      // Use standard styles or mix with custom
      styleInstructions = `Mix the following styles:\n${styles
        .filter(s => s !== 'custom')
        .map(style => stylePrompts[style as keyof typeof stylePrompts])
        .join('\n\n')}`;
      
      if (customPrompt) {
        styleInstructions += `\n\nAlso incorporate this custom theme: ${customPrompt}`;
      }
    }

    let systemPrompt = `You are generating authentic comments for a Christian gospel livestream called "A Special Service" hosted by Dr Daysman Oyakhilome. always generate comments in first person.

Generate ${batchSize} unique, diverse comments. ${styleInstructions}

IMPORTANT RULES:
1. Each comment must be SHORT (5-15 words maximum)
3. Include appropriate emojis sometimes
4. Make them feel authentic and spontaneous
5. Vary the enthusiasm level


Return ONLY a JSON array of comments. Each comment should be a simple string.
Example format: ["comment 1", "comment 2", "comment 3"]`;

    console.log('🤖 Calling OpenRouter AI...');
    
    // Call OpenRouter API with GPT-3.5-turbo (cheap and reliable)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'TFN Web Stream Comments',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // ~$0.001 per generation, very reliable
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate ${batchSize} comments now.`
          }
        ],
        temperature: 0.9, // More creative
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate comments with AI' },
        { status: 500 }
      );
    }

    const aiResponse = await response.json();
    console.log('✅ AI Response received');

    let generatedTexts: string[] = [];
    
    try {
      const content = aiResponse.choices[0].message.content;
      // Try to parse as JSON array
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        generatedTexts = parsed;
      } else {
        throw new Error('Not an array');
      }
    } catch (parseError) {
      // If parsing fails, split by newlines and clean up
      const content = aiResponse.choices[0].message.content;
      generatedTexts = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'))
        .map((line: string) => line.replace(/^["']|["']$/g, '').replace(/^-\s*/, '').replace(/^\d+\.\s*/, ''))
        .slice(0, batchSize);
    }

    // Generate comments with random usernames
    const comments = generatedTexts.map((text, index) => {
      const randomName = nigerianNames[Math.floor(Math.random() * nigerianNames.length)];
      const addNumber = Math.random() < 0.3;
      const username = addNumber ? `${randomName}${Math.floor(Math.random() * 1000)}` : randomName;
      
      // Determine style for this comment (distribute evenly)
      const styleIndex = Math.floor((index / batchSize) * styles.length);
      const style = styles[styleIndex] || styles[0];

      return {
        _id: new mongoose.Types.ObjectId(),
        username,
        text: text.substring(0, 500), // Limit length
        style,
      };
    });

    // Save to queue
    const queue = await CommentQueue.create({
      comments,
      streamId,
      status: 'pending',
      customPrompt,
      batchSize,
      styles,
    });

    console.log(`✅ Generated ${comments.length} comments, saved to queue`);

    return NextResponse.json({
      success: true,
      queueId: queue._id,
      comments: queue.comments,
      generatedAt: queue.generatedAt,
    });
  } catch (error) {
    console.error('Error generating comments:', error);
    return NextResponse.json(
      { error: 'Failed to generate comments' },
      { status: 500 }
    );
  }
}
