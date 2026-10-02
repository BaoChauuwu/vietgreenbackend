import { VisibilityType } from '@app/common/enums/visibility-type.enum';

const VISIBILITY_RANK: Record<VisibilityType, number> = {
	[VisibilityType.PRIVATE]: 0,
	[VisibilityType.FOLLOWERS_ONLY]: 1,
	[VisibilityType.PUBLIC]: 2,
};

export function capVisibility(
	requested: VisibilityType,
	maxVisibility: VisibilityType,
): VisibilityType {
	return VISIBILITY_RANK[requested] <= VISIBILITY_RANK[maxVisibility]
		? requested
		: maxVisibility;
}
