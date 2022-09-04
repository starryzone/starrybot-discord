export class StarryBackendDto {
  traveller: string;
}

export class KeplrSignedDto {
  traveller: string;
  signed: string;
  signature: string;
  account: string;
}

export class TokenRuleInfo {
  discordUserId: string;
  guildId: string;
}
