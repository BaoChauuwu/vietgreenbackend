const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'vietgreenx',
  password: 'vietgreenx123',
  database: 'vietgreenx_dev',
});

async function seedRealisticData() {
  await client.connect();
  console.log('🔌 Connected to PostgreSQL for seeding realistic agriculture data...');

  // Get Thủy Tiên green profile
  const userRes = await client.query(`
    SELECT gp.id as green_profile_id, gp.user_id
    FROM identity.users u
    JOIN agriculture.green_profiles gp ON u.id = gp.user_id
    WHERE u.username = 'chaudnbde180529'
    LIMIT 1
  `);

  if (userRes.rows.length === 0) {
    console.error('❌ User Thủy Tiên not found!');
    process.exit(1);
  }

  const thuyTienProfile = userRes.rows[0];

  // Also get other green profiles to seed for all users
  const allProfilesRes = await client.query(`
    SELECT id as green_profile_id, user_id FROM agriculture.green_profiles
  `);
  const allProfiles = allProfilesRes.rows;

  const seasonsData = [
    {
      greenProfileId: thuyTienProfile.green_profile_id,
      userId: thuyTienProfile.user_id,
      seasonName: 'Vụ Dưa Hấu Mặt Trời Đỏ - VietGAP 2026',
      cropType: 'Dưa hấu không hạt Mặt Trời Đỏ',
      areaHa: 2.5,
      startDate: '2026-05-01',
      expectedHarvestDate: '2026-07-25',
      status: 'active',
      notes: 'Vụ dưa hấu xuất khẩu chuẩn VietGAP kết hợp mô hình tưới nhỏ giọt Israel.',
      logs: [
        {
          activityType: 'sowing',
          logDate: '2026-05-05',
          notes: 'Gieo 5.000 hạt giống dưa hấu không hạt Mặt Trời Đỏ trên vỉ 84 lỗ, ủ nảy mầm đạt tỉ lệ 98%.',
          inputMaterial: 'Hạt giống F1 Trang Nông',
          dosage: '5000',
          dosageUnit: 'hạt',
          weather: 'Nắng nhẹ, nhiệt độ 28°C',
          pestStatus: 'Không phát hiện sâu bệnh',
          estimatedYield: 0,
        },
        {
          activityType: 'caring',
          logDate: '2026-05-15',
          notes: 'Bấm ngọn tạo 2 thân chính, làm giàn bò thoáng mát, nhổ cỏ gốc đợt 1.',
          inputMaterial: 'Màng phủ nông nghiệp',
          dosage: '2000',
          dosageUnit: 'm²',
          weather: 'Nắng ráo',
          pestStatus: 'Sạch bệnh',
          estimatedYield: 0,
        },
        {
          activityType: 'fertilizing',
          logDate: '2026-05-25',
          notes: 'Bón thúc đợt 1 phân hữu cơ vi sinh Sông Kôn 500kg/ha kết hợp tưới phun mưa.',
          inputMaterial: 'Phân hữu cơ Sông Kôn',
          dosage: '500',
          dosageUnit: 'kg/ha',
          weather: 'Nắng nhẹ',
          pestStatus: 'Tốt',
          estimatedYield: 0,
        },
        {
          activityType: 'spraying',
          logDate: '2026-06-05',
          notes: 'Phun chế phẩm sinh học Trichoderma phòng ngừa bệnh thán thư và nấm sương quẻ.',
          inputMaterial: 'Trichoderma Bio',
          dosage: '2',
          dosageUnit: 'kg/ha',
          weather: 'Trời nhiều mây',
          pestStatus: 'Phòng ngừa chủ động',
          estimatedYield: 0,
        },
        {
          activityType: 'irrigating',
          logDate: '2026-06-15',
          notes: 'Duy trì hệ thống tưới nhỏ giọt Israel 45 phút/ngày, đo độ ẩm đất đạt 75%.',
          inputMaterial: 'Nước giếng khoan qua lọc',
          dosage: '30',
          dosageUnit: 'm³/ha',
          weather: 'Nắng nóng 34°C',
          pestStatus: 'Bình thường',
          estimatedYield: 0,
        },
        {
          activityType: 'caring',
          logDate: '2026-06-25',
          notes: 'Tuyển trái chọn 1 quả/dây đẹp nhất, kê xốp cách ly trái khỏi mặt đất.',
          inputMaterial: 'Tấm kê xốp trái',
          dosage: '4500',
          dosageUnit: 'cái',
          weather: 'Nắng ráo',
          pestStatus: 'Trái phát triển đồng đều',
          estimatedYield: 15.5,
        },
        {
          activityType: 'fertilizing',
          logDate: '2026-07-05',
          notes: 'Bón phân Kali Sunfat tạo độ ngọt cho trái trước khi thu hoạch 15 ngày.',
          inputMaterial: 'Kali Sunfat K2SO4',
          dosage: '120',
          dosageUnit: 'kg/ha',
          weather: 'Nắng đẹp',
          pestStatus: 'Tốt',
          estimatedYield: 18.0,
        },
        {
          activityType: 'harvesting',
          logDate: '2026-07-20',
          notes: 'Thu hoạch đợt 1 đạt 12 tấn trái loại 1, đo độ đường Brix trung bình 13.5%.',
          inputMaterial: 'Sọt nhựa đóng gói',
          dosage: '500',
          dosageUnit: 'sọt',
          weather: 'Nắng ráo',
          pestStatus: 'Đạt chuẩn xuất khẩu',
          estimatedYield: 12.0,
        },
      ]
    },
    {
      greenProfileId: thuyTienProfile.green_profile_id,
      userId: thuyTienProfile.user_id,
      seasonName: 'Vụ Bưởi Da Xanh Ruột Hồng - GlobalGAP 2026',
      cropType: 'Bưởi da xanh ruột hồng',
      areaHa: 4.0,
      startDate: '2026-03-01',
      expectedHarvestDate: '2026-08-30',
      status: 'active',
      notes: 'Trang trại bưởi da xanh hữu cơ ứng dụng mã số vùng trồng xuất khẩu.',
      logs: [
        {
          activityType: 'sowing',
          logDate: '2026-03-10',
          notes: 'Trồng bổ sung 150 cây giống bưởi da xanh chiết cành ruột hồng F1.',
          inputMaterial: 'Cây giống bưởi F1 Bến Tre',
          dosage: '150',
          dosageUnit: 'cây',
          weather: 'Mưa nhẹ mát mẻ',
          pestStatus: 'Cây giống khỏe',
          estimatedYield: 0,
        },
        {
          activityType: 'caring',
          logDate: '2026-04-05',
          notes: 'Tỉa cành tạo tán nhện, vệ sinh gốc cây và quét vôi phòng nứt thân mủ bẩy.',
          inputMaterial: 'Vôi bột nông nghiệp',
          dosage: '50',
          dosageUnit: 'kg',
          weather: 'Nắng nhẹ',
          pestStatus: 'Sạch nấm mốc',
          estimatedYield: 0,
        },
        {
          activityType: 'fertilizing',
          logDate: '2026-04-20',
          notes: 'Bón phân trùn quế nguyên chất 10kg/gốc kết hợp phân đạm cá sinh học.',
          inputMaterial: 'Phân trùn quế cao cấp',
          dosage: '2',
          dosageUnit: 'tấn',
          weather: 'Nắng ấm',
          pestStatus: 'Tốt',
          estimatedYield: 0,
        },
        {
          activityType: 'spraying',
          logDate: '2026-05-10',
          notes: 'Phun tinh dầu neem dừa sinh học xua đuổi bọ trĩ và rệp sáp hại trái non.',
          inputMaterial: 'Chế phẩm Neem Oil',
          dosage: '5',
          dosageUnit: 'lít',
          weather: 'Trời tạnh ráo',
          pestStatus: 'Kiểm soát tốt rệp sáp',
          estimatedYield: 0,
        },
        {
          activityType: 'caring',
          logDate: '2026-05-28',
          notes: 'Bao trái bưởi bằng túi vải không dệt chuyên dụng ngăn ruồi vàng đẻ trứng.',
          inputMaterial: 'Túi bao bưởi 30x35cm',
          dosage: '3000',
          dosageUnit: 'cái',
          weather: 'Nắng ráo',
          pestStatus: 'An toàn ruồi vàng',
          estimatedYield: 10.0,
        },
        {
          activityType: 'harvesting',
          logDate: '2026-07-22',
          notes: 'Thu hoạch 8.5 tấn bưởi chuẩn loại 1 xuất khẩu Siêu thị Xanh.',
          inputMaterial: 'Thùng carton 12kg',
          dosage: '700',
          dosageUnit: 'thùng',
          weather: 'Nắng đẹp',
          pestStatus: 'Đạt chuẩn GlobalGAP',
          estimatedYield: 8.5,
        },
      ]
    },
    {
      greenProfileId: thuyTienProfile.green_profile_id,
      userId: thuyTienProfile.user_id,
      seasonName: 'Vụ Lúa ST25 Hữu Cơ Minh Bạch Blockchain 2026',
      cropType: 'Gạo hữu cơ ST25',
      areaHa: 5.0,
      startDate: '2026-06-15',
      expectedHarvestDate: '2026-10-15',
      status: 'active',
      notes: 'Mô hình lúa tôm sạch không hóa chất độc hại.',
      logs: [
        {
          activityType: 'sowing',
          logDate: '2026-06-20',
          notes: 'Sạ lúa giống ST25 xác nhận theo phương pháp sạ hàng 80kg/ha.',
          inputMaterial: 'Lúa giống ST25 nguyên chủng',
          dosage: '400',
          dosageUnit: 'kg',
          weather: 'Thời tiết thuận lợi',
          pestStatus: 'Sạ rộ nảy mầm đều',
          estimatedYield: 0,
        },
        {
          activityType: 'irrigating',
          logDate: '2026-07-02',
          notes: 'Bơm nước điều tiết ruộng lúa ngập 3-5cm duy trì đẻ nhánh khoẻ.',
          inputMaterial: 'Nước sông đầm ngọt',
          dosage: '100',
          dosageUnit: 'm³/ha',
          weather: 'Mưa rào rải rác',
          pestStatus: 'Lúa đẻ nhánh mạnh',
          estimatedYield: 0,
        },
        {
          activityType: 'fertilizing',
          logDate: '2026-07-15',
          notes: 'Bón phân khoáng mùn hữu cơ sinh học đợt đẻ nhánh rộ.',
          inputMaterial: 'Phân mùn hữu cơ Bio-Humic',
          dosage: '1.5',
          dosageUnit: 'tấn',
          weather: 'Nắng ấm',
          pestStatus: 'Lúa xanh mượt',
          estimatedYield: 25.0,
        },
      ]
    }
  ];

  // Seed for other profiles too
  for (const prof of allProfiles) {
    if (prof.green_profile_id === thuyTienProfile.green_profile_id) continue;

    seasonsData.push({
      greenProfileId: prof.green_profile_id,
      userId: prof.user_id,
      seasonName: 'Vụ Ớt Chuông Đà Lạt Hữu Cơ 2026',
      cropType: 'Ớt chuông 3 màu Đà Lạt',
      areaHa: 1.2,
      startDate: '2026-04-01',
      expectedHarvestDate: '2026-08-15',
      status: 'active',
      notes: 'Trồng trong nhà màng công nghệ cao Israel.',
      logs: [
        {
          activityType: 'sowing',
          logDate: '2026-04-10',
          notes: 'Ươm hạt giống ớt chuông đỏ, vàng, xanh trên khay xốp.',
          inputMaterial: 'Hạt giống Rijk Zwaan',
          dosage: '2000',
          dosageUnit: 'hạt',
          weather: 'Đà Lạt se lạnh 20°C',
          pestStatus: 'Tốt',
          estimatedYield: 0,
        },
        {
          activityType: 'caring',
          logDate: '2026-05-01',
          notes: 'Chuyển cây con ra luống trồng cố định bọc màng phủ.',
          inputMaterial: 'Giá thể xơ dừa phân trùn',
          dosage: '5',
          dosageUnit: 'm³',
          weather: 'Nắng nhẹ',
          pestStatus: 'Bén rễ nhanh',
          estimatedYield: 0,
        },
        {
          activityType: 'harvesting',
          logDate: '2026-07-24',
          notes: 'Thu hoạch 1.2 tấn ớt chuông tươi giòn giao chuỗi nhà hàng.',
          inputMaterial: 'Thùng xốp bảo quản',
          dosage: '100',
          dosageUnit: 'thùng',
          weather: 'Mát mẻ',
          pestStatus: 'Đạt chuẩn VietGAP',
          estimatedYield: 1.2,
        },
      ]
    });
  }

  for (const seasonData of seasonsData) {
    const seasonRes = await client.query(`
      INSERT INTO agriculture.crop_seasons
      (green_profile_id, created_by, season_name, crop_type, area_ha, start_date, expected_harvest_date, status, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id
    `, [
      seasonData.greenProfileId,
      seasonData.userId,
      seasonData.seasonName,
      seasonData.cropType,
      seasonData.areaHa,
      seasonData.startDate,
      seasonData.expectedHarvestDate,
      seasonData.status,
      seasonData.notes
    ]);

    const seasonId = seasonRes.rows[0].id;

    for (const log of seasonData.logs) {
      await client.query(`
        INSERT INTO agriculture.production_logs
        (crop_season_id, created_by, log_date, activity_type, input_material, dosage, dosage_unit, notes, weather, pest_status, estimated_yield, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `, [
        seasonId,
        seasonData.userId,
        log.logDate,
        log.activityType,
        log.inputMaterial,
        log.dosage,
        log.dosageUnit,
        log.notes,
        log.weather,
        log.pestStatus,
        log.estimatedYield
      ]);
    }
  }

  console.log('✅ Seeded realistic agricultural crop seasons & production logs successfully!');
  await client.end();
}

seedRealisticData().catch(e => {
  console.error('❌ Error seeding realistic data:', e);
  process.exit(1);
});
