/** Session snapshot passed to achievement checks */
export interface AchievementSession {
  swarmerKills: number;
  healerKills: number;
  kills: number;
  perfectSequence: boolean;
}