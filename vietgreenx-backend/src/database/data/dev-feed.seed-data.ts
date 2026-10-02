import { UserRole } from '@app/common/enums/user-role.enum';
import { PostCategory } from '@app/common/enums/post-category.enum';
import { PostTagType } from '@app/common/enums/post-tag-type.enum';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';

export const DEV_FEED_PASSWORD = '123qwe!@#';
export const DEV_FEED_POSTS_PER_USER = 10;
export const DEV_FEED_USERNAME_PREFIX = 'feed_';

export type DevFeedUserSeed = {
	role: UserRole;
	username: string;
	email: string;
	phone: string;
	displayName: string;
	province: string;
};

export const DEV_FEED_USERS: DevFeedUserSeed[] = [
	{
		role: UserRole.CONSUMER,
		username: 'feed_consumer',
		email: 'feed_consumer@test.local',
		phone: '0903000001',
		displayName: 'Feed Consumer',
		province: 'TP. Hồ Chí Minh',
	},
	{
		role: UserRole.SELLER,
		username: 'feed_seller',
		email: 'feed_seller@test.local',
		phone: '0903000002',
		displayName: 'Feed Seller',
		province: 'Đà Lạt',
	},
	{
		role: UserRole.COOPERATIVE,
		username: 'feed_coop',
		email: 'feed_coop@test.local',
		phone: '0903000003',
		displayName: 'Feed Cooperative',
		province: 'Cần Thơ',
	},
	{
		role: UserRole.ENTERPRISE,
		username: 'feed_enterprise',
		email: 'feed_enterprise@test.local',
		phone: '0903000004',
		displayName: 'Feed Enterprise',
		province: 'Bình Dương',
	},
	{
		role: UserRole.EXPERT,
		username: 'feed_expert',
		email: 'feed_expert@test.local',
		phone: '0903000005',
		displayName: 'Feed Expert',
		province: 'Hà Nội',
	},
	{
		role: UserRole.ADMIN,
		username: 'feed_admin',
		email: 'feed_admin@test.local',
		phone: '0903000006',
		displayName: 'Feed Admin',
		province: 'Đà Nẵng',
	},
];

export type DevFeedPostTagSeed = {
	tagType: PostTagType;
	refLabel: string;
	refId?: string;
};

export type DevFeedPostSeed = {
	body: string | null;
	category?: PostCategory;
	visibility?: VisibilityType;
	mediaCount: number;
	tags: DevFeedPostTagSeed[];
};

const HASHTAG_POOL = [
	'nongsan',
	'raucu',
	'organic',
	'vietgap',
	'ocop',
	'muahe2026',
	'truyxuat',
	'dalat',
	'cantho',
	'phunong',
];

export type DevFeedCategoryRef = {
	id: string;
	nameVi: string;
};

export function buildDevFeedPostSeeds(
	role: UserRole,
	province: string,
	categories: DevFeedCategoryRef[],
): DevFeedPostSeed[] {
	const categoryA = categories[0];
	const categoryB = categories[1] ?? categories[0];

	return [
		{
			body: `[${role}] Short post — went to the market early today, vegetables were super fresh.`,
			mediaCount: 0,
			tags: [],
		},
		{
			body: `[${role}] Sharing the harvest season #${HASHTAG_POOL[0]} #${HASHTAG_POOL[1]} in ${province}. Anyone interested, drop a comment!`,
			category: PostCategory.PRODUCE_STORY,
			mediaCount: 0,
			tags: [],
		},
		{
			body: `[${role}] Garden photo from this morning #${HASHTAG_POOL[2]} #${HASHTAG_POOL[3]}`,
			category: PostCategory.CROP_JOURNAL,
			mediaCount: 1,
			tags: [],
		},
		{
			body: `[${role}] Harvest album — 3 different angles #${HASHTAG_POOL[4]}`,
			category: PostCategory.FARMING_TECHNIQUE,
			mediaCount: 3,
			tags: [],
		},
		{
			body: null,
			category: PostCategory.PRODUCE_STORY,
			mediaCount: 2,
			tags: [],
		},
		{
			body: `[${role}] Attaching an agriculture category tag to this post.`,
			category: PostCategory.TRADE_CONNECTION,
			mediaCount: 1,
			tags: [
				{
					tagType: PostTagType.CATEGORY,
					refId: categoryA.id,
					refLabel: categoryA.nameVi,
				},
			],
		},
		{
			body: `[${role}] Tagging region ${province} #${HASHTAG_POOL[5]}`,
			category: PostCategory.MARKET_PRICE,
			mediaCount: 0,
			tags: [
				{
					tagType: PostTagType.REGION,
					refLabel: province,
				},
			],
		},
		{
			body: `[${role}] Mix tag + hashtag #${HASHTAG_POOL[6]} #${HASHTAG_POOL[7]} #${HASHTAG_POOL[8]}`,
			category: PostCategory.OCOP_VIETGAP_STORY,
			mediaCount: 2,
			tags: [
				{
					tagType: PostTagType.CATEGORY,
					refId: categoryB.id,
					refLabel: categoryB.nameVi,
				},
				{
					tagType: PostTagType.REGION,
					refLabel: province,
				},
			],
		},
		{
			body: `[${role}] Detailed farming journal — watered at 6am, applied organic fertilizer, monitored pests. #${HASHTAG_POOL[9]} #${HASHTAG_POOL[0]}`,
			category: PostCategory.CROP_JOURNAL,
			mediaCount: 1,
			tags: [
				{
					tagType: PostTagType.REGION,
					refLabel: province,
				},
			],
		},
		{
			body: `[${role}] Market prices are shifting this week — update for fellow farmers #${HASHTAG_POOL[1]} #${HASHTAG_POOL[2]}`,
			category: PostCategory.MARKET_PRICE,
			visibility: VisibilityType.PUBLIC,
			mediaCount: 1,
			tags: [
				{
					tagType: PostTagType.CATEGORY,
					refId: categoryA.id,
					refLabel: categoryA.nameVi,
				},
			],
		},
	];
}
