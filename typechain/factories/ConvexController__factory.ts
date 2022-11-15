/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ConvexController,
  ConvexControllerInterface,
} from "../ConvexController";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_manager",
        type: "address",
      },
      {
        internalType: "address",
        name: "_accessControl",
        type: "address",
      },
      {
        internalType: "address",
        name: "_addressRegistry",
        type: "address",
      },
      {
        internalType: "address",
        name: "_convexBooster",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ADD_LIQUIDITY_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "BOOSTER",
    outputs: [
      {
        internalType: "contract IConvexBooster",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MISC_OPERATION_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "REMOVE_LIQUIDITY_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "accessControl",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "addressRegistry",
    outputs: [
      {
        internalType: "contract IAddressRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "staking",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "minAmount",
            type: "uint256",
          },
        ],
        internalType: "struct ConvexController.ExpectedReward[]",
        name: "expectedRewards",
        type: "tuple[]",
      },
    ],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "lpToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "staking",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "poolId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "depositAndStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "manager",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "lpToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "staking",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x610160604052604051620000139062000213565b60405190819003812060e0526200002a90620001ea565b60405190819003812061010052620000429062000231565b604051908190039020610120523480156200005c57600080fd5b5060405162002001380380620020018339810160408190526200007f916200018a565b8383836001600160a01b038316620000b45760405162461bcd60e51b8152600401620000ab9062000291565b60405180910390fd5b6001600160a01b038216620000dd5760405162461bcd60e51b8152600401620000ab9062000291565b6001600160a01b038116620001065760405162461bcd60e51b8152600401620000ab9062000291565b6001600160601b0319606093841b811660805291831b821660a05290911b1660c0526001600160a01b038116620001515760405162461bcd60e51b8152600401620000ab906200025a565b60601b6001600160601b0319166101405250620002ba915050565b80516001600160a01b03811681146200018457600080fd5b92915050565b60008060008060808587031215620001a0578384fd5b620001ac86866200016c565b9350620001bd86602087016200016c565b9250620001ce86604087016200016c565b9150620001df86606087016200016c565b905092959194509250565b7f52454d4f56455f4c49515549444954595f524f4c450000000000000000000000815260150190565b714144445f4c49515549444954595f524f4c4560701b815260120190565b7f4d4953435f4f5045524154494f4e5f524f4c4500000000000000000000000000815260130190565b60208082526017908201527f494e56414c49445f424f4f535445525f41444452455353000000000000000000604082015260600190565b6020808252600f908201526e494e56414c49445f4144445245535360881b604082015260600190565b60805160601c60a05160601c60c05160601c60e05161010051610120516101405160601c611ca1620003606000398061038a52806105215280610f365280610faf525080610b625280610f125250806107295280610f5a5250806101ee5280610a6c52508061029b52806107d65280610f7e5250806101c152806106fc5280610a905280610b3552508061016452806106a85280610ab45280610ae15250611ca16000f3fe608060405234801561001057600080fd5b50600436106100be5760003560e01c806356205dc51161007657806375b0ffd11161005b57806375b0ffd1146101415780637e841d5414610149578063f3ad65f414610151576100be565b806356205dc51461012657806361bea27f14610139576100be565b80630f967dd6116100a75780630f967dd6146100eb57806313007d5514610109578063481c6a751461011e576100be565b80630a9f0dcc146100c35780630c1e8bf7146100d8575b600080fd5b6100d66100d1366004611553565b610159565b005b6100d66100e6366004611513565b61069d565b6100f3610a6a565b60405161010091906116b4565b60405180910390f35b610111610a8e565b604051610100919061166d565b610111610ab2565b6100d6610134366004611598565b610ad6565b6100f3610f10565b610111610f34565b6100f3610f58565b610111610f7c565b306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146101aa5760405162461bcd60e51b81526004016101a190611a2f565b60405180910390fd5b604051632474521560e21b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906391d1485490610218907f00000000000000000000000000000000000000000000000000000000000000009033906004016116bd565b60206040518083038186803b15801561023057600080fd5b505afa158015610244573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102689190611619565b6102845760405162461bcd60e51b81526004016101a19061198a565b6040516303adac9960e61b81526001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169063eb6b2640906102d390879060009060040161169b565b60206040518083038186803b1580156102eb57600080fd5b505afa1580156102ff573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103239190611619565b61033f5760405162461bcd60e51b81526004016101a1906118bf565b6001600160a01b0383166103655760405162461bcd60e51b81526004016101a190611ad4565b600081116103855760405162461bcd60e51b81526004016101a190611b68565b6000807f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316631526fe27856040518263ffffffff1660e01b81526004016103d491906116b4565b60c060405180830381600087803b1580156103ee57600080fd5b505af1158015610402573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104269190611489565b5050935050509150816001600160a01b0316866001600160a01b03161461045f5760405162461bcd60e51b81526004016101a190611a66565b806001600160a01b0316856001600160a01b0316146104905760405162461bcd60e51b81526004016101a1906119c1565b61049a8684610fa0565b6040516370a0823160e01b81526000906001600160a01b038716906370a08231906104c990309060040161166d565b602060405180830381600087803b1580156104e357600080fd5b505af11580156104f7573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061051b9190611639565b905060007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166343a0d066878760016040518463ffffffff1660e01b815260040161057093929190611be6565b602060405180830381600087803b15801561058a57600080fd5b505af115801561059e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105c29190611619565b9050806105e15760405162461bcd60e51b81526004016101a1906117e3565b600061067183896001600160a01b03166370a08231306040518263ffffffff1660e01b8152600401610613919061166d565b602060405180830381600087803b15801561062d57600080fd5b505af1158015610641573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106659190611639565b9063ffffffff61108516565b90508581146106925760405162461bcd60e51b81526004016101a190611851565b505050505050505050565b306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146106e55760405162461bcd60e51b81526004016101a190611a2f565b604051632474521560e21b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906391d1485490610753907f00000000000000000000000000000000000000000000000000000000000000009033906004016116bd565b60206040518083038186803b15801561076b57600080fd5b505afa15801561077f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107a39190611619565b6107bf5760405162461bcd60e51b81526004016101a1906119f8565b6040516303adac9960e61b81526001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169063eb6b26409061080e90869060009060040161169b565b60206040518083038186803b15801561082657600080fd5b505afa15801561083a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061085e9190611619565b61087a5760405162461bcd60e51b81526004016101a1906118bf565b6001600160a01b0382166108a05760405162461bcd60e51b81526004016101a190611ad4565b600081116108c05760405162461bcd60e51b81526004016101a190611b68565b6040516370a0823160e01b81526000906001600160a01b038516906370a08231906108ef90309060040161166d565b60206040518083038186803b15801561090757600080fd5b505afa15801561091b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061093f9190611639565b90506000836001600160a01b031663c32e72028460006040518363ffffffff1660e01b8152600401610972929190611bd6565b602060405180830381600087803b15801561098c57600080fd5b505af11580156109a0573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109c49190611619565b9050806109e35760405162461bcd60e51b81526004016101a190611888565b6000610a4183876001600160a01b03166370a08231306040518263ffffffff1660e01b8152600401610a15919061166d565b60206040518083038186803b158015610a2d57600080fd5b505afa158015610641573d6000803e3d6000fd5b9050838114610a625760405162461bcd60e51b81526004016101a190611851565b505050505050565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610b1e5760405162461bcd60e51b81526004016101a190611a2f565b604051632474521560e21b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906391d1485490610b8c907f00000000000000000000000000000000000000000000000000000000000000009033906004016116bd565b60206040518083038186803b158015610ba457600080fd5b505afa158015610bb8573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610bdc9190611619565b610bf85760405162461bcd60e51b81526004016101a19061181a565b6001600160a01b038316610c1e5760405162461bcd60e51b81526004016101a190611ad4565b80610c3b5760405162461bcd60e51b81526004016101a19061173e565b60608167ffffffffffffffff81118015610c5457600080fd5b50604051908082528060200260200182016040528015610c7e578160200160208202803683370190505b50905060005b82811015610dc8576000848483818110610c9a57fe5b610cb0926020604090920201908101915061146d565b6001600160a01b03161415610cd75760405162461bcd60e51b81526004016101a190611775565b6000848483818110610ce557fe5b9050604002016020013511610d0c5760405162461bcd60e51b81526004016101a190611b9f565b838382818110610d1857fe5b610d2e926020604090920201908101915061146d565b6001600160a01b03166370a08231306040518263ffffffff1660e01b8152600401610d59919061166d565b60206040518083038186803b158015610d7157600080fd5b505afa158015610d85573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610da99190611639565b828281518110610db557fe5b6020908102919091010152600101610c84565b50836001600160a01b0316633d18b9126040518163ffffffff1660e01b8152600401602060405180830381600087803b158015610e0457600080fd5b505af1158015610e18573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e3c9190611619565b610e585760405162461bcd60e51b81526004016101a190611707565b60005b82811015610f09576000610ec9838381518110610e7457fe5b6020026020010151868685818110610e8857fe5b610e9e926020604090920201908101915061146d565b6001600160a01b03166370a08231306040518263ffffffff1660e01b8152600401610a15919061166d565b9050848483818110610ed757fe5b90506040020160200135811015610f005760405162461bcd60e51b81526004016101a190611851565b50600101610e5b565b5050505050565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b604051636eb1769f60e11b81527f0000000000000000000000000000000000000000000000000000000000000000906000906001600160a01b0385169063dd62ed3e90610ff39030908690600401611681565b60206040518083038186803b15801561100b57600080fd5b505afa15801561101f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110439190611639565b90508015611065576110656001600160a01b038516838363ffffffff6110ad16565b61107f6001600160a01b038516838563ffffffff6111dc16565b50505050565b6000828211156110a75760405162461bcd60e51b81526004016101a1906118f6565b50900390565b600061115782604051806060016040528060298152602001611c4360299139604051636eb1769f60e11b81526001600160a01b0388169063dd62ed3e906110fa9030908a90600401611681565b60206040518083038186803b15801561111257600080fd5b505afa158015611126573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061114a9190611639565b919063ffffffff61126c16565b905061107f8463095ea7b360e01b858460405160240161117892919061169b565b60408051601f198184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915261129d565b600061115782856001600160a01b031663dd62ed3e30876040518363ffffffff1660e01b8152600401611210929190611681565b60206040518083038186803b15801561122857600080fd5b505afa15801561123c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112609190611639565b9063ffffffff61133116565b600081848411156112905760405162461bcd60e51b81526004016101a191906116d4565b50508183035b9392505050565b60606112f2826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166113569092919063ffffffff16565b80519091501561132c57808060200190518101906113109190611619565b61132c5760405162461bcd60e51b81526004016101a190611b0b565b505050565b6000828201838110156112965760405162461bcd60e51b81526004016101a1906117ac565b6060611365848460008561136d565b949350505050565b60608247101561138f5760405162461bcd60e51b81526004016101a19061192d565b6113988561142e565b6113b45760405162461bcd60e51b81526004016101a190611a9d565b60006060866001600160a01b031685876040516113d19190611651565b60006040518083038185875af1925050503d806000811461140e576040519150601f19603f3d011682016040523d82523d6000602084013e611413565b606091505b5091509150611423828286611434565b979650505050505050565b3b151590565b60608315611443575081611296565b8251156114535782518084602001fd5b8160405162461bcd60e51b81526004016101a191906116d4565b60006020828403121561147e578081fd5b813561129681611c2a565b60008060008060008060c087890312156114a1578182fd5b86516114ac81611c2a565b60208801519096506114bd81611c2a565b60408801519095506114ce81611c2a565b60608801519094506114df81611c2a565b60808801519093506114f081611c2a565b60a08801519092508015158114611505578182fd5b809150509295509295509295565b600080600060608486031215611527578283fd5b833561153281611c2a565b9250602084013561154281611c2a565b929592945050506040919091013590565b60008060008060808587031215611568578384fd5b843561157381611c2a565b9350602085013561158381611c2a565b93969395505050506040820135916060013590565b6000806000604084860312156115ac578283fd5b83356115b781611c2a565b9250602084013567ffffffffffffffff808211156115d3578384fd5b81860187601f8201126115e4578485fd5b80359250818311156115f4578485fd5b876020604085028301011115611608578485fd5b949760209095019650909450505050565b60006020828403121561162a578081fd5b81518015158114611296578182fd5b60006020828403121561164a578081fd5b5051919050565b60008251611663818460208701611bfe565b9190910192915050565b6001600160a01b0391909116815260200190565b6001600160a01b0392831681529116602082015260400190565b6001600160a01b03929092168252602082015260400190565b90815260200190565b9182526001600160a01b0316602082015260400190565b60006020825282518060208401526116f3816040850160208701611bfe565b601f01601f19169190910160400192915050565b60208082526013908201527f434c41494d5f5245574152445f4641494c454400000000000000000000000000604082015260600190565b60208082526018908201527f494e56414c49445f45585045435445445f524557415244530000000000000000604082015260600190565b6020808252601c908201527f494e56414c49445f5245574152445f544f4b454e5f4144445245535300000000604082015260600190565b6020808252601b908201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604082015260600190565b60208082526018908201527f4445504f5349545f414e445f5354414b455f4641494c45440000000000000000604082015260600190565b60208082526017908201527f4e4f545f4d4953435f4f5045524154494f4e5f524f4c45000000000000000000604082015260600190565b60208082526015908201527f42414c414e43455f4d5553545f494e4352454153450000000000000000000000604082015260600190565b60208082526015908201527f57495448445241575f5354414b455f4641494c45440000000000000000000000604082015260600190565b60208082526010908201527f494e56414c49445f4c505f544f4b454e00000000000000000000000000000000604082015260600190565b6020808252601e908201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604082015260600190565b60208082526026908201527f416464726573733a20696e73756666696369656e742062616c616e636520666f60408201527f722063616c6c0000000000000000000000000000000000000000000000000000606082015260800190565b60208082526016908201527f4e4f545f4144445f4c49515549444954595f524f4c4500000000000000000000604082015260600190565b60208082526018908201527f504f4f4c5f49445f5354414b494e475f4d49534d415443480000000000000000604082015260600190565b60208082526019908201527f4e4f545f52454d4f56455f4c49515549444954595f524f4c4500000000000000604082015260600190565b60208082526013908201527f4e4f545f4d414e414745525f4144445245535300000000000000000000000000604082015260600190565b60208082526019908201527f504f4f4c5f49445f4c505f544f4b454e5f4d49534d4154434800000000000000604082015260600190565b6020808252601d908201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604082015260600190565b60208082526017908201527f494e56414c49445f5354414b494e475f41444452455353000000000000000000604082015260600190565b6020808252602a908201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e60408201527f6f74207375636365656400000000000000000000000000000000000000000000606082015260800190565b6020808252600e908201527f494e56414c49445f414d4f554e54000000000000000000000000000000000000604082015260600190565b60208082526019908201527f494e56414c49445f4d494e5f5245574152445f414d4f554e5400000000000000604082015260600190565b9182521515602082015260400190565b92835260208301919091521515604082015260600190565b60005b83811015611c19578181015183820152602001611c01565b8381111561107f5750506000910152565b6001600160a01b0381168114611c3f57600080fd5b5056fe5361666545524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa26469706673582212201477e4a9cb7d7228fd20a14d45f20a4afff985727c84900169f845969f47d6ea64736f6c634300060b0033";

export class ConvexController__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    _manager: string,
    _accessControl: string,
    _addressRegistry: string,
    _convexBooster: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ConvexController> {
    return super.deploy(
      _manager,
      _accessControl,
      _addressRegistry,
      _convexBooster,
      overrides || {}
    ) as Promise<ConvexController>;
  }
  getDeployTransaction(
    _manager: string,
    _accessControl: string,
    _addressRegistry: string,
    _convexBooster: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _manager,
      _accessControl,
      _addressRegistry,
      _convexBooster,
      overrides || {}
    );
  }
  attach(address: string): ConvexController {
    return super.attach(address) as ConvexController;
  }
  connect(signer: Signer): ConvexController__factory {
    return super.connect(signer) as ConvexController__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ConvexControllerInterface {
    return new utils.Interface(_abi) as ConvexControllerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ConvexController {
    return new Contract(address, _abi, signerOrProvider) as ConvexController;
  }
}