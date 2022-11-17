import "hardhat";
import * as yargs from "yargs";
import dotenv from "dotenv";
import voteDestinationSetupCommand from "./vote_destination_setup_command";
import delegationDestinationSetupCommand from "./delegation_destination_setup_command";
import voteDestinationSetupManualCommand from "./vote_destination_setup_manual_command";
import voteTokenMultiplierSetup from "./vote_token_multipliers_command";
import voteEventSendSetup from "./vote_enable_event_send_command";
import voteReactorSetupCommand from "./vote_reactor_setup_command";
import stakingScheduleSetupCommand from "./staking_schedule_setup_command";
import newTestnetTokenCommand from "./testnettoken_new_command";
import runSystemVotesToJSONCommand from "./vote_systemvote_to_json_command";
import runUserVotesToIPFSSetupCommand from "./vote_uservote_to_ipfs";
import voteProxySubmittersSetup from "./vote_proxy_submitters_command";
import voteSetReactorKeySetupCommand from "./vote_set_reactor_key_command";
import voteWeightSetup from "./vote_weights";
import mintTestnetTokenCommand from "./testnettoken_mint_command";
import notionalAddressSetup from "./stake_notional";
import rewardsDrain from "../emergency/rewards-drain-cli";
import systemStopGnosis from "../emergency/full-system/full-stop-gnosis";
import registerPoolsManager from "../pool/register_pools_manager";
import cycleRolloverTrackerSetup from "./cycle_rollover_tracker_destination_setup_command";
import tokePause from "../emergency/toke-pause";
import managerGrantRole from "./manager_grant_role";

dotenv.config();

yargs
    .scriptName("script-cli")
    .strict()
    .command(voteTokenMultiplierSetup)
    .command(voteDestinationSetupCommand)
    .command(delegationDestinationSetupCommand)
    .command(voteEventSendSetup)
    .command(voteReactorSetupCommand)
    .command(stakingScheduleSetupCommand)
    .command(newTestnetTokenCommand)
    .command(runSystemVotesToJSONCommand)
    .command(runUserVotesToIPFSSetupCommand)
    .command(mintTestnetTokenCommand)
    .command(voteSetReactorKeySetupCommand)
    .command(voteProxySubmittersSetup)
    .command(voteDestinationSetupManualCommand)
    .command(voteWeightSetup)
    .command(notionalAddressSetup)
    .command(rewardsDrain)
    .command(systemStopGnosis)
    .command(registerPoolsManager)
    .command(cycleRolloverTrackerSetup)
    .command(managerGrantRole)
    .command(tokePause).argv;
