// Generate simulated gospel comments
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/comment';

const gospelComments = [
  "Amen! God is good! 🙏",
  "Glory to God! Hallelujah!",
  "Praise the Lord! 🙌",
  "Thank you Jesus for this message!",
  "Watching from Lagos! God bless you pastor! 🇳🇬",
  "Viewing from Abuja! Amen!",
  "Greetings from Jos! Powerful message! 🙏",
  "Watching from Kaduna! Glory to God!",
  "Port Harcourt in the house! Hallelujah! 🙌",
  "Watching from Enugu! God bless Dr Daysman!",
  "Greetings from Ibadan! Amen and Amen!",
  "Viewing from Kano! This is powerful!",
  "Watching from Nairobi, Kenya! 🇰🇪 Praise God!",
  "Greetings from Accra, Ghana! 🇬🇭 Hallelujah!",
  "Watching from Johannesburg! God is good! 🇿🇦",
  "Viewing from Kampala, Uganda! 🇺🇬 Amen!",
  "Cape Town watching! Glory to God! 🇿🇦",
  "Watching from Dar es Salaam! 🇹🇿 Praise the Lord!",
  "Greetings from Kigali, Rwanda! 🇷🇼",
  "Dr Daysman, thank you for this word! 🙏",
  "God bless you Dr Daysman Oyakhilome!",
  "Dr Daysman is speaking life! Amen!",
  "Thank you Pastor Daysman for this message!",
  "Dr Daysman Oyakhilome, man of God! �",
  "Powerful teaching Dr Daysman!",
  "The Holy Spirit is moving! Watching from Lagos!",
  "Amen! Receiving this word in Jesus name!",
  "Glory be to God! This is powerful!",
  "Hallelujah! What a mighty God we serve!",
  "Jesus is Lord! 🙌",
  "I receive this blessing in Jesus name!",
  "Thank you for this word of God!",
  "The Lord is my shepherd! 🙏",
  "God's grace is sufficient!",
  "Amen! Walking in faith!",
  "Blessed by this message from Dr Daysman!",
  "Holy Ghost fire! 🔥",
  "God is faithful! All glory to Him!",
  "Praying along with you! Watching from Warri! 🙏",
  "This is my testimony! Praise God!",
  "Jesus Christ is King!",
  "Receiving healing in Jesus name!",
  "The word of God is alive!",
  "Thank you Lord for your goodness!",
  "Amen! God's love never fails!",
  "Breakthrough is coming! Watching from Benin City! 🙌",
  "Glory! I feel the presence of God!",
  "Hallelujah! Victory is ours!",
  "Amen! Standing on His promises!",
  "Jesus paid it all!",
  "God's mercy endures forever!",
  "Praise break! 🙌🙌🙌",
  "The blood of Jesus covers us!",
  "Amen! Faith over fear!",
  "God is working it out for my good!",
  "Receiving this prophetic word!",
  "Holy Spirit lead us!",
  "This sermon is life-changing!",
  "Amen! God's timing is perfect!",
  "Jesus is the way, truth, and life!",
  "Miracle working God! 🙏",
  "This is my season of favor!",
  "Glory to the Most High!",
  "Amen! Trust in the Lord!",
  "God's grace abounds!",
  "Hallelujah! What a wonderful Savior!",
  "Breakthrough anointing is here!",
  "Jesus, take the wheel! 🙌",
  "I'm blessed to be here! Watching from Calabar! 🙏",
  "God never fails!",
  "Receiving divine favor!",
  "The Lord is good! Amen!",
  "Claiming this blessing!",
  "Holy Spirit move in this place!",
  "God's word is truth!",
  "Amen! Hallelujah!",
  "Praise God from whom all blessings flow!",
  "Jesus is my Savior! 🙏",
  "Glory to God in the highest!",
  "Amen! God's promises are yes!",
  "Faith like a mustard seed!",
  "The Lord is my strength!",
  "Blessed be the name of the Lord!",
  "God is on the throne!",
  "Receiving this anointing!",
  "Jesus saves! Hallelujah!",
  "Thank you Father God!",
  "Amen! By His stripes we are healed!",
  "Watching from Owerri! Powerful word!",
  "Viewing from Uyo! God bless you sir!",
  "Greetings from Abeokuta! Amen!",
  "Watching from Ilorin! Glory to God!",
  "Viewing from Maiduguri! Hallelujah!",
  "Greetings from Sokoto! Praise the Lord!",
  "Watching from Zaria! God is good!",
  "Viewing from Makurdi! Amen and Amen!",
  "Dr Daysman, your ministry is a blessing!",
  "Thank you Dr Daysman for touching lives!",
  "CEF Jos in the house! Glory to God! 🙌",
  "Watching from CEF! Powerful teaching!",
  "Praise God for Dr Daysman's ministry!",
  "This message is for me! Thank you Dr Daysman!",
  "Anointed teaching! God bless you Pastor Daysman!",
  "Watching from Lusaka, Zambia! 🇿🇲 Amen!",
  "Greetings from Addis Ababa! 🇪🇹 Hallelujah!",
  "Viewing from Harare, Zimbabwe! 🇿🇼 Praise God!",
];

const nigerianNames = [
  "Adewale", "Chidinma", "Oluwaseun", "Chukwuemeka", "Blessing", "Emmanuel",
  "Adeola", "Chiamaka", "Tunde", "Ngozi", "Segun", "Amaka", "Yemi", "Ifeoma",
  "Kunle", "Chioma", "Femi", "Nneka", "Bolu", "Adaeze", "Wale", "Ebere",
  "Tolu", "Chinyere", "Dare", "Oge", "Biodun", "Amarachi", "Kemi", "Obiageli",
  "Seyi", "Uchechi", "Lanre", "Nkechi", "Gbenga", "Chinenye", "Sola", "Ijeoma",
  "Dele", "Adaora", "Toyin", "Chinonso", "Bayo", "Ifunanya", "Yinka", "Nnamdi",
  "Funmi", "Chukwudi", "Jide", "Nkemdilim", "Tobi", "Ezinne", "Shola", "Uchenna",
  "Kola", "Chidera", "Deji", "Ngozika", "Niyi", "Chiamaka", "Tayo", "Adaugo",
  "Ibrahim", "Fatima", "Musa", "Aisha", "Usman", "Zainab", "Sani", "Hauwa",
  "Abdullahi", "Hadiza", "Aliyu", "Maryam", "Ahmed", "Safiya", "Abubakar", "Aishatu",
  "John", "Grace", "David", "Faith", "Michael", "Joy", "Daniel", "Peace",
  "Samuel", "Mercy", "Joseph", "Hope", "Peter", "Love", "Paul", "Patience",
  "James", "Favour", "Abraham", "Gift", "Moses", "Glory", "Isaac", "Precious",
  "Joshua", "Victory", "Stephen", "Divine", "Matthew", "Goodness", "Mark", "Praise",
];

const locations = [
  "Lagos", "Abuja", "Jos", "Kaduna", "Port Harcourt", "Enugu", "Ibadan", "Kano",
  "Warri", "Benin City", "Calabar", "Owerri", "Uyo", "Abeokuta", "Ilorin", "Maiduguri",
  "Sokoto", "Zaria", "Makurdi", "CEF Jos", "Nairobi", "Accra", "Johannesburg",
  "Kampala", "Cape Town", "Dar es Salaam", "Kigali", "Lusaka", "Addis Ababa", "Harare",
  "Abuja FCT", "Lekki", "Victoria Island", "Ikeja", "Surulere", "Yaba",
];

export async function POST(req: NextRequest) {
  try {
    const { streamId } = await req.json();

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Clean up old comments to prevent database bloat
    // Keep only the latest 500 comments per stream
    const commentCount = await Comment.countDocuments({ streamId });
    if (commentCount > 500) {
      // Get the oldest comments to delete
      const commentsToDelete = await Comment.find({ streamId })
        .sort({ createdAt: 1 }) // Oldest first
        .limit(commentCount - 500) // Delete excess comments
        .select('_id')
        .lean();
      
      const idsToDelete = commentsToDelete.map(c => c._id);
      await Comment.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`🗑️ Cleaned up ${idsToDelete.length} old comments for stream ${streamId}`);
    }

    // Generate random comment and username
    const randomComment = gospelComments[Math.floor(Math.random() * gospelComments.length)];
    
    // Generate username - just the name, sometimes with numbers
    const randomName = nigerianNames[Math.floor(Math.random() * nigerianNames.length)];
    const addNumber = Math.random() < 0.3; // 30% chance to add number
    const randomUsername = addNumber ? `${randomName}${Math.floor(Math.random() * 1000)}` : randomName;

    // Create simulated comment in database
    const comment = await Comment.create({
      streamId: streamId,
      userId: `simulated_${Date.now()}_${Math.random()}`,
      username: randomUsername,
      text: randomComment,
    });

    return NextResponse.json({
      success: true,
      comment: {
        _id: comment._id,
        streamId: comment.streamId,
        userId: comment.userId,
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating simulated comment:', error);
    return NextResponse.json(
      { error: 'Failed to create simulated comment' },
      { status: 500 }
    );
  }
}
