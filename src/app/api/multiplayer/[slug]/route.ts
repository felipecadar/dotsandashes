import { NextRequest, NextResponse } from 'next/server';
import { applyAction, GameState } from '@/lib/game';
import { createClient } from '@/utils/supabase/server';

const initialState = {
  squares: {},
  currentplayer: "p1",
  turnnumber: 1,
  scores: { p1: 0, p2: 0 },
  edges: {},
} as GameState;

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const slug = req.nextUrl.pathname.split('/').pop();
  // const channel = await supabase.channel(`multiplayer:${slug}`);
  // console.log("Channel:", `multiplayer:${slug}`);
  
  if (!slug) {
    return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.details !== 'The result contains 0 rows') {
    console.error("Error fetching game state:", error);
    return NextResponse.json({ message: 'Error fetching game state' }, { status: 500 });
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from('games')
      .insert([{ 
        slug, 
        ...initialState
       }]);
    
    if (insertError) {
      console.error("Error inserting initial game state:", insertError);
      return NextResponse.json({ message: 'Error inserting initial game state' }, { status: 500 });
    }
    // sendGameState(channel, initialState);
    return NextResponse.json(initialState);
  }

  // sendGameState(channel, data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const slug = req.nextUrl.pathname.split('/').pop();

  if (!slug) {
    return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
  }

  const { gameState: receivedGameState, action } = await req.json();
  // console.log("Received game state:", receivedGameState);
  
  let gameState = receivedGameState || initialState;

  gameState = applyAction(gameState, action);
  const { error } = await supabase
    .from('games')
    .update(gameState)
    .eq('slug', slug);

  if (error) {
    console.error("Error updating game state:", error);
    return NextResponse.json({ message: 'Error updating game state' }, { status: 500 });
  }

  return NextResponse.json(gameState);
}
