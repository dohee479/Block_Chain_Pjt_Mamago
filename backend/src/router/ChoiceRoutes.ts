import express, { response } from "express"
import Web3 from 'web3'
import { UserModel } from "../model/UserModel"

// contract주소
const address = '0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8';
const ChoiceRoutes = express.Router()
// contract_select


const ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_selectPerson",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_selectedPerson",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_article",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_selectedArticle",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_point",
				"type": "uint256"
			}
		],
		"name": "RewardLogic",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	}
]

//계좌생성
ChoiceRoutes.post("/newBalance",async (req: express.Request, res: express.Response) => {
	let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); 
  // const data = req
  let wallet_address : String = ""
  await web3.eth.personal.newAccount(req.body['wallet_password'])
  .then(response => {
    wallet_address = response
    res.status(200).send(wallet_address)
  });
})

// 계좌확인
ChoiceRoutes.post("/getBalance",async (req: express.Request, res: express.Response) => {
    let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    let my_money : String = ""
    await web3.eth.getBalance(req.body['address'])
    .then( response => {
      console.log(typeof(Number(response)))
      // 0.024 이더 -> 1알 = 10000원
      my_money = String((Number(response) / 10**18) * 41.7) 
      res.status(200).send(my_money)
    });
})

// 상대방 계좌 저장 
ChoiceRoutes.post("/userAccount", async (req: express.Request, res: express.Response) => {
  const user_id = req.body["user_id"]
	await UserModel.findOne({ _id: user_id })
    .exec((err: Error, user:any) => {
      // console.log(err,"에러")
      // console.log(user.user_wallet,"지갑")
      if(err){
        res.status(500).send(err)
      }else{
        res.status(200).send(user.user_wallet)
      }
    })
})

// 계좌송금
ChoiceRoutes.post("/transcoin",async (req: express.Request, res: express.Response) => {
  console.log('들어왔니')
  let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
  let fromEgg = req.body['fromEgg']
  let toEgg  = req.body['toEgg']
  let PassWord  = req.body['Password']
  let Egg = req.body['Egg']
  let success : boolean = false

  console.log('충전한다잉')
  console.log(req.body)
  if(!PassWord){
    await web3.eth.personal.unlockAccount(fromEgg, "1234", 600).then(() => console.log('Account unlocked!1'));
    await web3.eth.personal.unlockAccount(fromEgg, "1234", 600).then(() => console.log('Account unlocked!2'));
  }
  else{
    await web3.eth.personal.unlockAccount(fromEgg, PassWord, 600).then(() => console.log('Account unlocked!1'));
    await web3.eth.personal.unlockAccount(fromEgg, PassWord, 600).then(() => console.log('Account unlocked!2'));
  }
    //계좌가 unlock됫다면 이제 돈보내면된다
  await web3.eth.sendTransaction({
      from: fromEgg, // 출금 계좌(통역 의뢰인)
      to: toEgg, // 입금 계좌 (통역가)
      value: (Egg / 41.7)*(10**18) // 통역 대가
  })
  .then(response => {
    console.log('success')
    console.log(response)
    success = true 
    res.status(200).send(success)
  });
  // .catch(err => {
  //   console.log('fail')
  //   console.log(err)
  //   res.status(403).send({ message: "돈이 없어용" })
  // });   
})

ChoiceRoutes.post("/contracting", async (req: express.Request, res: express.Response) => {
  let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
  // web3.eth.personal.unlockAccount("0x5ec940f76caaccd269d07bd78c0e00c1638eba8c", "test1234", 600)
  // .then(console.log('Account unlocked!'));
  let selectTokenAbi:any = ABI;
  let TokenContract = new web3.eth.Contract(selectTokenAbi, address);
  console.log('컨트랙트 저장 되냐')
​  console.log(req.body)
  console.log(TokenContract.methods)

  let _selectPerson : string = req.body['_selectPerson']
  let _selectedPerson : string = req.body['_selectedPerson']
  let article : string = req.body['article']
  let _selectedArticle : string = req.body['_selectedArticle']
  let _point : number = req.body['_point']
  let passWord : string = req.body['passWord']

  await web3.eth.personal.unlockAccount(_selectPerson, passWord, 600).then(() => console.log('Account unlocked!1'));
  await web3.eth.personal.unlockAccount(_selectPerson, passWord, 600).then(() => console.log('Account unlocked!2'));

  // selectPerson, selectedPerson, 
  TokenContract.methods.RewardLogic(_selectPerson, _selectedPerson, article, _selectedArticle, _point)
  .send({from: _selectPerson})
  .on('transactionHash', function(hash:any){
      console.log('해쉬야');
      console.log(hash);
  })
  .on('error', function(error:any) {
      console.log('에러야');
      console.log(error);
  });  
})

export { ChoiceRoutes }