// POST /api/admin/comments/generate
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommentQueue from '@/models/commentQueue';
import ViewerConfig from '@/models/viewerConfig';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const { batchSize, customPrompt, streamId } = await req.json();

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

    // Persistent program background set by the admin (saved on the global config).
    const cfg = await ViewerConfig.findOne({ streamId: 'global' });
    const programContext = cfg?.programContext?.trim();
    const programBackground = programContext
      ? `\n\nBackground about this program (use it to keep comments relevant): ${programContext}`
      : '';

    // Optional theme to steer the comments; otherwise generate generic
    // authentic comments for the service.
    const themeInstruction = customPrompt
      ? `Base the comments on this theme: ${customPrompt}`
      : `Generate a natural mix of authentic comments for the service — praise, short testimonies, prayers, and viewers greeting from their location.`;

    let systemPrompt = `You are generating authentic comments for a Christian gospel livestream called "A Special Service" hosted by Dr Daysman Oyakhilome. Always write comments in first person.${programBackground}

Generate ${batchSize} unique comments. ${themeInstruction}

For EACH comment, also invent a realistic viewer username that fits that comment's culture and tone:
- A location/greeting comment from Lagos or Abuja should get a Nigerian name; an international greeting should get an international name.
- Mix the formats so they never look templated: some first-name-only, some full names, a few lowercase handles, and occasionally a name with a number (e.g. "grace_o", "Emeka", "Ruth Kamau", "blessed247").

MAKE THE BATCH FEEL HUMAN AND DIVERSE:
1. Each comment must be SHORT (about 3-15 words).
2. Vary the length a lot — some very short (3-4 words), some longer.
3. Vary tone, capitalization, and punctuation between comments.
4. NEVER use emojis, emoticons, or country-flag symbols. Text only.
5. Vary the enthusiasm level; make them feel spontaneous, not copied.
6. Do NOT repeat near-identical phrasings within the batch.

Return ONLY valid JSON in EXACTLY this shape (no markdown, no extra text):
{ "comments": [ { "username": "Emeka", "text": "Watching from Lagos, glory to God" }, { "username": "grace_o", "text": "Amen, this word is timely" } ] }`;

    console.log('🤖 Calling OpenRouter AI (GPT-5)...');

    // Call OpenRouter API with GPT-5. Note: GPT-5 is a reasoning model —
    // it only accepts the default temperature, needs a larger token budget
    // (reasoning tokens are spent before output), and supports JSON mode.
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'TFN Web Stream Comments',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
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
        max_tokens: 4000, // room for reasoning tokens + JSON output
        reasoning: { effort: 'low' }, // short chat lines don't need heavy reasoning
        response_format: { type: 'json_object' },
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

    // The model returns a JSON object: { comments: [ { username, text }, ... ] }
    let generatedItems: { username?: string; text?: string }[] = [];

    try {
      const content = aiResponse.choices[0].message.content;
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.comments)) {
        generatedItems = parsed.comments;
      } else if (Array.isArray(parsed)) {
        // Tolerate a bare array of objects just in case
        generatedItems = parsed;
      } else {
        throw new Error('Unexpected JSON shape');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      return NextResponse.json(
        { error: 'AI returned an unparseable response' },
        { status: 500 }
      );
    }

    // Build comments in the queue shape: { _id, username, text }.
    // Trust the AI for usernames; drop any item missing a username or text.
    const comments = generatedItems
      .map((item) => {
        const username = String(item?.username ?? '').trim().slice(0, 60);
        const text = String(item?.text ?? '').trim().slice(0, 500);

        return {
          _id: new mongoose.Types.ObjectId(),
          username,
          text,
        };
      })
      .filter((c) => c.username.length > 0 && c.text.length > 0);

    if (comments.length === 0) {
      return NextResponse.json(
        { error: 'AI returned no usable comments' },
        { status: 500 }
      );
    }

    // Save to queue
    const queue = await CommentQueue.create({
      comments,
      streamId,
      status: 'pending',
      customPrompt,
      batchSize,
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
