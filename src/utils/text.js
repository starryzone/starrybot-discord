// TO-DO most generic file name ive ever seen

const getRoleAmount = role => {
  if (['DAOVotePercentage', 'DAOMostParticipation'].includes(role.token_type)) {
    return `${role.has_minimum_of}%`;
  } else if (role.token_type === 'DAOVoteMinimum') {
    return role.has_minimum_of;
  } else {
    return role.has_minimum_of / (10 ** role.decimals);
  }
}

const getRoleDescription = role => {
  let description = '';

  switch(role.token_type) {
    case 'DAOVoteMinimum':
      description = `Must have voted at least ${getRoleAmount(role)} time(s)`;
      break;
    case 'DAOVotePercentage':
      description = `Must have voted in at least ${getRoleAmount(role)} of proposals`;
      break;
    case 'DAOMostParticipation':
      description = `Must be in the top ${getRoleAmount(role)} in vote participation`;
      break;  
    case 'native':
      description = `Must have at least ${getRoleAmount(role)} ${role.token_address.toUppercase()} tokens`
      break;
    case 'cw721':
      description = `Must have at least ${getRoleAmount(role)} CW721`
      break;
    case 'cw20':
      description = `Must have at least ${getRoleAmount(role)} CW20`;
    default:
      break;
  }

  if (role.token_type.includes('DAO')) {
    if (role.count_staked_only) {
      description = description + ` out of the last ${role.decimals} proposals`;
    } else {
      description = description + ' ever';
    }
  } else {
    if (role.count_staked_only) {
      description = description + ' (Staked tokens only)';
    }
  }

  return description;
}


module.exports = {
  getRoleAmount,
  getRoleDescription,
}