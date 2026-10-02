const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'vietgreenx',
  password: 'vietgreenx123',
  database: 'vietgreenx_dev',
});

async function seedMoreChatData() {
  await client.connect();
  console.log('🔌 Connected to PostgreSQL for additional chat seed...');

  // Get users
  const usersRes = await client.query(`
    SELECT u.id, u.username, p.display_name
    FROM identity.users u
    LEFT JOIN identity.profiles p ON u.id = p.user_id
  `);

  const users = usersRes.rows;
  const findUserById = (id) => users.find(u => u.id === id);
  const findUserByUsername = (username) => users.find(u => u.username === username);

  const thuyTien = users.find(u => u.username === 'chaudnbde180529' || (u.display_name && u.display_name.includes('Thủy Tiên')));
  const admin = findUserByUsername('admin');
  const chau1 = findUserByUsername('0377408268');
  const baoChau1 = findUserByUsername('0763559435');
  const baoChau2 = findUserByUsername('0377408266');
  const baoChau3 = findUserByUsername('0763559438');

  if (!thuyTien) {
    console.error('❌ Thủy Tiên user not found!');
    process.exit(1);
  }

  const additionalConversations = [
    {
      partner: baoChau2,
      messages: [
        { sender: baoChau2, body: 'Anh Châu ơi, đợt giống nấm đùi gà đợt này tỉ lệ ra mũ mầm đạt 98% rồi nha anh!', minutesAgo: 360 },
        { sender: thuyTien, body: 'Tuyệt vời em ơi! Tuần sau thu hoạch đợt 1 báo anh chốt xe lạnh chở đi kho Đà Nẵng nhé.', minutesAgo: 330 },
        { sender: baoChau2, body: 'Dạ vâng anh, bên em đang cho kiểm tra độ ẩm phòng ươm hằng ngày luôn ạ.', minutesAgo: 300 },
        { sender: thuyTien, body: 'Ok em, giữ vững chất lượng này là siêu thị chốt đơn dài hạn luôn!', minutesAgo: 240 },
        { sender: baoChau2, body: 'Dạ anh yên tâm!', minutesAgo: 180 },
      ]
    },
    {
      partner: chau1,
      messages: [
        { sender: chau1, body: 'Bên mình vừa giao xong 50 thùng bơ 034 cho chuỗi siêu thị WinMart rồi nhé.', minutesAgo: 720 },
        { sender: thuyTien, body: 'Đã nhận mã vận đơn trên VietGreenX, kiểm tra hàng bơ sáp dẻo ngon lắm anh Châu ơi!', minutesAgo: 690 },
        { sender: chau1, body: 'Cảm ơn em! Đợt tới bơ ngon vườn Lâm Đồng về tiếp anh nhắn ngay.', minutesAgo: 660 },
      ]
    },
    {
      partner: baoChau1,
      messages: [
        { sender: baoChau1, body: 'Em vừa kiểm tra nhiệt độ kho lạnh giữ ở 4°C chuẩn quy trình bảo quản rau củ tươi rồi nha chị.', minutesAgo: 500 },
        { sender: thuyTien, body: 'Ok em, nhớ theo dõi độ ẩm tầm 85-90% nữa nhé.', minutesAgo: 480 },
        { sender: baoChau1, body: 'Dạ vâng chị, cảm biến tự động báo số liệu chuẩn liên tục ạ!', minutesAgo: 450 },
      ]
    },
    {
      partner: admin,
      messages: [
        { sender: admin, body: 'Chào mừng bạn đến với Nền tảng Nông nghiệp Xanh VietGreenX!', minutesAgo: 10080 },
        { sender: admin, body: 'Hồ sơ doanh nghiệp và chứng nhận VietGAP của bạn đã được kiểm duyệt và xác minh thành công.', minutesAgo: 10050 },
        { sender: thuyTien, body: 'Cảm ơn Admin nhiều ạ! Chúc hệ thống VietGreenX ngày càng phát triển.', minutesAgo: 10000 },
      ]
    },
    {
      partner: baoChau3,
      messages: [
        { sender: thuyTien, body: 'Chào Bảo Châu, lô cam sành Vinh Kim đã hoàn tất kiểm định Dư lượng thuốc BVTV chưa bạn?', minutesAgo: 420 },
        { sender: baoChau3, body: 'Dạ đã có kết quả xét nghiệm 0 mẫu vi phạm, phiếu kiểm nghiệm đạt chuẩn xuất khẩu rồi nhé!', minutesAgo: 390 },
        { sender: thuyTien, body: 'Quá chuẩn luôn, cho đóng thùng dán tem QR VietGreenX luôn nhé.', minutesAgo: 360 },
      ]
    }
  ];

  const now = new Date();

  for (const convData of additionalConversations) {
    if (!convData.partner) continue;

    // Check existing
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
      console.log(`ℹ️ Conversation with ${convData.partner.display_name || convData.partner.username} exists (${conversationId})`);
    } else {
      const convRes = await client.query(`
        INSERT INTO messaging.conversations (conversation_type, name, created_at, updated_at)
        VALUES ('direct', null, NOW(), NOW())
        RETURNING id
      `);
      conversationId = convRes.rows[0].id;

      await client.query(`
        INSERT INTO messaging.conversation_members (conversation_id, user_id, joined_at)
        VALUES ($1, $2, NOW()), ($1, $3, NOW())
      `, [conversationId, thuyTien.id, convData.partner.id]);

      console.log(`✨ Created conversation with ${convData.partner.display_name || convData.partner.username} (${conversationId})`);
    }

    let lastMsgTime = now;
    for (const msg of convData.messages) {
      if (!msg.sender) continue;
      const msgCreatedAt = new Date(now.getTime() - msg.minutesAgo * 60 * 1000);
      lastMsgTime = msgCreatedAt;

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

    await client.query(`
      UPDATE messaging.conversations
      SET last_message_at = $1, updated_at = $1
      WHERE id = $2
    `, [lastMsgTime, conversationId]);
  }

  console.log('✅ Additional chat seeds inserted successfully!');
  await client.end();
}

seedMoreChatData().catch(e => {
  console.error('❌ Error seeding additional chat data:', e);
  process.exit(1);
});
