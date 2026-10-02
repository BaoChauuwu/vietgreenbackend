const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'vietgreenx',
  password: 'vietgreenx123',
  database: 'vietgreenx_dev',
});

async function seedChatData() {
  await client.connect();
  console.log('🔌 Connected to PostgreSQL...');

  // 1. Get users
  const usersRes = await client.query(`
    SELECT u.id, u.username, p.display_name
    FROM identity.users u
    LEFT JOIN identity.profiles p ON u.id = p.user_id
  `);

  const users = usersRes.rows;
  const findUser = (query) => users.find(u => 
    (u.username && u.username.toLowerCase().includes(query.toLowerCase())) ||
    (u.display_name && u.display_name.toLowerCase().includes(query.toLowerCase()))
  );

  const thuyTien = findUser('Thủy Tiên') || findUser('chaudnbde180529');
  const baoNgoc = findUser('Bảo Ngọc') || findUser('0935555435');
  const phuMinh = findUser('Phú Minh') || findUser('0935555543');
  const htxAnPhuoc = findUser('htx_anphuoc') || findUser('An Phước');
  const minhtuan = findUser('thuonglai_minhtuan') || findUser('Minh Tuấn');
  const hoaHoa = findUser('Hòa Hòa') || findUser('0935555555');

  console.log('Target Users:', {
    thuyTien: thuyTien?.display_name,
    baoNgoc: baoNgoc?.display_name,
    phuMinh: phuMinh?.display_name,
    htxAnPhuoc: htxAnPhuoc?.display_name,
    minhtuan: minhtuan?.display_name,
    hoaHoa: hoaHoa?.display_name,
  });

  if (!thuyTien) {
    console.error('❌ Thủy Tiên user not found!');
    process.exit(1);
  }

  const conversationSeedData = [
    {
      partner: baoNgoc,
      messages: [
        { sender: thuyTien, body: 'Hí lu Ngọc em iu', minutesAgo: 60 },
        { sender: baoNgoc, body: 'ai dậy', minutesAgo: 59 },
        { sender: thuyTien, body: 'anh Châu này', minutesAgo: 59 },
        { sender: baoNgoc, body: 'Châu nào dị bảy', minutesAgo: 58 },
        { sender: thuyTien, body: 'Châu bên dự án VietGreenX đây nè, hôm nay rau mầm đợt mới về chưa em?', minutesAgo: 45 },
        { sender: baoNgoc, body: 'Dạ đợt rau VietGAP này sáng nay vừa thu hoạch xong luôn anh ơi!', minutesAgo: 40 },
        { sender: baoNgoc, body: 'Hàng đẹp chuẩn VietGAP, tầm 100kg chị em trong HTX đang đóng gói.', minutesAgo: 38 },
        { sender: thuyTien, body: 'Ok tuyệt vời quá! Chiều cho anh xin báo giá với hình thực tế nhé.', minutesAgo: 30 },
        { sender: baoNgoc, body: 'gì kì dị', minutesAgo: 3 },
      ]
    },
    {
      partner: htxAnPhuoc,
      messages: [
        { sender: thuyTien, body: 'Dạ chào HTX An Phước ạ, bên mình tuần này còn rau xà lách thuỷ canh không ạ?', minutesAgo: 1440 },
        { sender: htxAnPhuoc, body: 'Chào bạn, bên mình hiện sẵn kho 300kg xà lách Lollo Bionda và Romaine nhé.', minutesAgo: 1420 },
        { sender: htxAnPhuoc, body: 'Tất cả đều có mã QR truy xuất nguồn gốc đầy đủ trên hệ thống VietGreenX.', minutesAgo: 1410 },
        { sender: thuyTien, body: 'Dạ tốt quá, gửi cho bên em hợp đồng mẫu và lịch giao hàng tuần sau với ạ!', minutesAgo: 1350 },
        { sender: htxAnPhuoc, body: 'Ok bạn, bên mình gửi bảng giá và hợp đồng qua mail liền nhé.', minutesAgo: 1300 },
      ]
    },
    {
      partner: minhtuan,
      messages: [
        { sender: minhtuan, body: 'Em Châu ơi, đợt dưa lưới Huỳnh Long đợt tới chốt sản lượng bao nhiêu tấn vậy?', minutesAgo: 2880 },
        { sender: thuyTien, body: 'Dạ đợt này HTX báo về dự kiến khoảng 5 tấn anh Tuấn ơi.', minutesAgo: 2820 },
        { sender: minhtuan, body: 'Tuyệt vời, Siêu thị Xanh bao tiêu toàn bộ lô này nhé. Sáng mai anh ghé khảo sát vườn!', minutesAgo: 2760 },
      ]
    },
    {
      partner: phuMinh,
      messages: [
        { sender: phuMinh, body: 'Alo Châu ơi, tài khoản bên mình đã cập nhật chứng nhận VietGAP chưa?', minutesAgo: 180 },
        { sender: thuyTien, body: 'Dạ em vừa tải hồ sơ chứng nhận lên phần Hồ sơ xanh rồi anh Minh nhé!', minutesAgo: 150 },
        { sender: phuMinh, body: 'Ok em, anh thấy hệ thống xác nhận rồi. Cảm ơn em nhiều!', minutesAgo: 140 },
      ]
    },
    {
      partner: hoaHoa,
      messages: [
        { sender: hoaHoa, body: 'Chị ơi, hạt giống cà chua cherry đợt này ươm nảy mầm đều lắm ạ!', minutesAgo: 120 },
        { sender: thuyTien, body: 'Tốt quá Hòa ơi, ghi nhật ký sản xuất đều đặn lên app nhé!', minutesAgo: 100 },
      ]
    }
  ];

  const now = new Date();

  for (const convData of conversationSeedData) {
    if (!convData.partner) continue;

    // Check if conversation already exists between thuyTien & partner
    const existingConvRes = await client.query(`
      SELECT cm1.conversation_id
      FROM messaging.conversation_members cm1
      JOIN messaging.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
      WHERE cm1.user_id = $1 AND cm2.user_id = $2
      LIMIT 1
    `, [thuyTien.id, convData.partner.id]);

    let conversationId;
    if (existingConvRes.rows.length > 0) {
      conversationId = existingConvRes.rows[0].conversation_id;
      console.log(`ℹ️ Conversation with ${convData.partner.display_name} already exists (${conversationId})`);
    } else {
      // Insert new conversation
      const convRes = await client.query(`
        INSERT INTO messaging.conversations (conversation_type, name, created_at, updated_at)
        VALUES ('direct', null, NOW(), NOW())
        RETURNING id
      `);
      conversationId = convRes.rows[0].id;

      // Insert members
      await client.query(`
        INSERT INTO messaging.conversation_members (conversation_id, user_id, joined_at)
        VALUES ($1, $2, NOW()), ($1, $3, NOW())
      `, [conversationId, thuyTien.id, convData.partner.id]);

      console.log(`✨ Created conversation with ${convData.partner.display_name} (${conversationId})`);
    }

    // Insert messages
    let lastMsgTime = now;
    for (const msg of convData.messages) {
      if (!msg.sender) continue;
      const msgCreatedAt = new Date(now.getTime() - msg.minutesAgo * 60 * 1000);
      lastMsgTime = msgCreatedAt;

      // Check if message already exists
      const existingMsg = await client.query(`
        SELECT id FROM messaging.messages
        WHERE conversation_id = $1 AND sender_id = $2 AND body = $3
        LIMIT 1
      `, [conversationId, msg.sender.id, msg.body]);

      if (existingMsg.rows.length === 0) {
        await client.query(`
          INSERT INTO messaging.messages (conversation_id, sender_id, body, message_type, metadata, read_by, created_at)
          VALUES ($1, $2, $3, 'text', '{}', $4, $5)
        `, [conversationId, msg.sender.id, msg.body, [msg.sender.id], msgCreatedAt]);
      }
    }

    // Update conversation last_message_at
    await client.query(`
      UPDATE messaging.conversations
      SET last_message_at = $1, updated_at = $1
      WHERE id = $2
    `, [lastMsgTime, conversationId]);
  }

  console.log('✅ Seed chat data completed successfully!');
  await client.end();
}

seedChatData().catch(e => {
  console.error('❌ Error seeding chat data:', e);
  process.exit(1);
});
