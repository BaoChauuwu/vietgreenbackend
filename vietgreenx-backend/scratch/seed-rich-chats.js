const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'vietgreenx',
  password: 'vietgreenx123',
  database: 'vietgreenx_dev',
});

async function seedRichChats() {
  await client.connect();
  console.log('🔌 Connected to PostgreSQL for rich chat seeding...');

  // Get users
  const usersRes = await client.query(`
    SELECT u.id, u.username, p.display_name
    FROM identity.users u
    LEFT JOIN identity.profiles p ON u.id = p.user_id
  `);

  const users = usersRes.rows;
  const thuyTien = users.find(u => u.username === 'chaudnbde180529' || (u.display_name && u.display_name.includes('Thủy Tiên')));
  const baoNgoc = users.find(u => u.username === '0935555435' || (u.display_name && u.display_name.includes('Bảo Ngọc')));
  const htxAnPhuoc = users.find(u => u.username === 'htx_anphuoc' || (u.display_name && u.display_name.includes('An Phước')));
  const minhtuan = users.find(u => u.username === 'thuonglai_minhtuan' || (u.display_name && u.display_name.includes('Minh Tuấn')));
  const phuMinh = users.find(u => u.username === '0935555543' || (u.display_name && u.display_name.includes('Phú Minh')));
  const hoaHoa = users.find(u => u.username === '0935555555' || (u.display_name && u.display_name.includes('Hòa Hòa')));
  const baoChau2 = users.find(u => u.username === '0377408266' || (u.display_name && u.display_name.includes('Đỗ Nguyễn Bảo Châu')));
  const chau1 = users.find(u => u.username === '0377408268');
  const baoChau1 = users.find(u => u.username === '0763559435');

  if (!thuyTien) {
    console.error('❌ Thủy Tiên user not found!');
    process.exit(1);
  }

  // Create or retrieve conversations and seed extended messages
  const richConversations = [
    {
      partner: baoNgoc,
      messages: [
        { sender: thuyTien, body: 'Ngọc ơi đợt dưa hấu không hạt Mặt Trời đỏ bên em thu hoạch tuần tới đúng không?', minutesAgo: 25 },
        { sender: baoNgoc, body: 'Dạ đúng rồi anh Châu ơi! Độ đường Brix đợt này đo thử đạt 13% siêu ngọt luôn ạ.', minutesAgo: 20 },
        { sender: baoNgoc, body: 'Bên em đóng sọt gỗ 25kg có dán tem mã QR truy xuất VietGreenX đầy đủ nha.', minutesAgo: 18 },
        { sender: thuyTien, body: 'Cho anh gửi 50 sọt về đại lý khu vực Cẩm Lệ nhé!', minutesAgo: 12 },
        { sender: baoNgoc, body: 'Dạ chốt đơn anh nhé! Xe tải lạnh 2 tấn sáng mai xuất phát ạ.', minutesAgo: 5 },
      ]
    },
    {
      partner: htxAnPhuoc,
      messages: [
        { sender: htxAnPhuoc, body: 'Chào bạn, lô ớt chuông Đà Lạt 3 màu chuẩn hữu cơ đợt này vừa về kho nhé!', minutesAgo: 90 },
        { sender: thuyTien, body: 'Ớt chuông tươi giòn không chị ơi? Em lấy 100kg giao cho chuỗi nhà hàng ăn sạch.', minutesAgo: 80 },
        { sender: htxAnPhuoc, body: 'Tươi nguyên cuống vừa hái sáng nay nhé em, hình thực tế tại vườn đây nha!', minutesAgo: 70 },
        { sender: thuyTien, body: 'Tuyệt vời quá chị, chốt lịch giao 8h sáng mai tại Kho trung chuyển giúp em nhé.', minutesAgo: 50 },
        { sender: htxAnPhuoc, body: 'Ok em nhé, tài xế đã nhận lệnh vận chuyển rồi.', minutesAgo: 40 },
      ]
    },
    {
      partner: minhtuan,
      messages: [
        { sender: minhtuan, body: 'Châu ơi, thị trường tiêu thụ bưởi da xanh đợt này bên Siêu thị Xanh tăng 40% đó!', minutesAgo: 300 },
        { sender: thuyTien, body: 'Dạ tin vui quá anh Tuấn! Các bà con nông dân trong HTX nghe tin mừng lắm.', minutesAgo: 280 },
        { sender: minhtuan, body: 'Tuần sau anh chốt thêm hợp đồng cung ứng 10 tấn bưởi loại 1 ruột hồng nha.', minutesAgo: 240 },
        { sender: thuyTien, body: 'Dạ vâng anh, bên em sẵn sàng nguồn cung chuẩn mã số vùng trồng ạ!', minutesAgo: 210 },
      ]
    },
    {
      partner: phuMinh,
      messages: [
        { sender: phuMinh, body: 'Hồ sơ nhật ký sản xuất đợt lúa ST25 hữu cơ đã cập nhật lên Blockchain VietGreenX rồi nhé Châu.', minutesAgo: 450 },
        { sender: thuyTien, body: 'Dạ tuyệt vời quá anh Minh ơi! Mã hash minh bạch từ gieo sạ đến thu hoạch luôn.', minutesAgo: 420 },
        { sender: phuMinh, body: 'Khách hàng quét mã QR trên bao bì gạo chốt đơn liên tục luôn em.', minutesAgo: 390 },
      ]
    },
    {
      partner: baoChau2,
      messages: [
        { sender: baoChau2, body: 'Anh Châu ơi, vườn thanh long ruột đỏ GlobalGAP vừa hoàn tất chu kỳ bón phân hữu cơ sinh học.', minutesAgo: 600 },
        { sender: thuyTien, body: 'Tốt lắm em! Nhớ quay clip ngắn cập nhật nhật ký chăm sóc cây nhé.', minutesAgo: 550 },
        { sender: baoChau2, body: 'Dạ clip em đã tải lên mục Nhật ký sản xuất trên ứng dụng rồi ạ.', minutesAgo: 500 },
      ]
    },
    {
      partner: hoaHoa,
      messages: [
        { sender: hoaHoa, body: 'Chị Châu ơi, đợt khoai lang mật Đà Lạt ủ ngọt ăn ngon dẻo quánh luôn ạ!', minutesAgo: 800 },
        { sender: thuyTien, body: 'Cho chị xin báo giá sỉ đợt 500kg đóng bao lưới 10kg nhé!', minutesAgo: 750 },
        { sender: hoaHoa, body: 'Dạ giá sỉ ưu đãi 18.000đ/kg chuẩn hàng bao bù nhé chị.', minutesAgo: 700 },
      ]
    }
  ];

  const now = new Date();

  for (const convData of richConversations) {
    if (!convData.partner) continue;

    // Get or create conversation
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
    }

    // Insert messages
    let lastMsgTime = now;
    for (const msg of convData.messages) {
      if (!msg.sender) continue;
      const msgCreatedAt = new Date(now.getTime() - msg.minutesAgo * 60 * 1000);
      if (msgCreatedAt > lastMsgTime) lastMsgTime = msgCreatedAt;

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
      SET last_message_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [conversationId]);
  }

  console.log('✅ Rich chat messages seeded successfully!');
  await client.end();
}

seedRichChats().catch(e => {
  console.error('❌ Error seeding rich chat data:', e);
  process.exit(1);
});
